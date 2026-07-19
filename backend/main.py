"""Mamayya Pickles order API.

Single-file FastAPI backend: orders (server-side pricing), order tracking,
contact messages. SQLite storage next to this file. Payment gateway is not
integrated; orders are stored as test orders.

Run:  uvicorn main:app --port 8001 --reload  (from the backend/ directory)
"""

import json
import logging
import os
import smtplib
import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

logger = logging.getLogger("mamayya")

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"

DB_PATH = Path(__file__).parent / "mamayya.db"

# Postgres in production (set DATABASE_URL), SQLite locally.
DATABASE_URL = os.environ.get("DATABASE_URL", "")
IS_PG = DATABASE_URL.startswith(("postgres://", "postgresql://"))
if IS_PG:
    import psycopg
    from psycopg.rows import dict_row


def _sql(query: str) -> str:
    """SQL is written with %s placeholders; SQLite wants ?."""
    return query if IS_PG else query.replace("%s", "?")

# Prices mirror src/lib/products.ts. The server is the pricing authority:
# client-sent prices are ignored, totals are recomputed here.
PRODUCT_PRICES: dict[str, dict[int, int]] = {
    "chicken-pickle": {250: 349, 500: 649, 1000: 1249, 2000: 2399, 5000: 5799},
    "mutton-pickle": {250: 449, 500: 849, 1000: 1649, 2000: 3199, 5000: 7799},
    "fish-pickle": {250: 399, 500: 749, 1000: 1449, 2000: 2799, 5000: 6799},
    "shrimp-pickle": {250: 449, 500: 849, 1000: 1649, 2000: 3199, 5000: 7799},
}
BOX_PRICES: dict[str, int] = {
    "tasting-box": 1499,
    "family-box": 1399,
    "coastal-box": 1499,
    "full-mamayya-box": 2799,
}
FREE_SHIPPING_THRESHOLD = 1200
SHIPPING_FEE = 99

# Order lifecycle: stage begins N days after the order was placed.
STAGES = [
    ("confirmed", 0),
    ("preparing", 1),
    ("packed", 3),
    ("shipped", 4),
    ("out_for_delivery", 6),
    ("delivered", 7),
]

app = FastAPI(title="Mamayya Pickles API", version="0.1.0")

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get(
        "ALLOWED_ORIGINS",
        "http://localhost:3001,http://127.0.0.1:3001,"
        "https://mamayyapickles.com,https://www.mamayyapickles.com,"
        "http://mamayyapickles.com,http://www.mamayyapickles.com,"
        "https://nikhil-ai-dev.github.io",
    ).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@contextmanager
def db():
    if IS_PG:
        conn = psycopg.connect(DATABASE_URL, row_factory=dict_row)
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    pk = "SERIAL PRIMARY KEY" if IS_PG else "INTEGER PRIMARY KEY AUTOINCREMENT"
    ddl = [
        f"""
        CREATE TABLE IF NOT EXISTS orders (
            rowid_pk {pk},
            order_id TEXT UNIQUE,
            created_at TEXT NOT NULL,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT NOT NULL,
            address TEXT NOT NULL,
            city TEXT NOT NULL,
            pincode TEXT NOT NULL,
            lines_json TEXT NOT NULL,
            subtotal INTEGER NOT NULL,
            shipping INTEGER NOT NULL,
            total INTEGER NOT NULL
        )
        """,
        f"""
        CREATE TABLE IF NOT EXISTS contact_messages (
            id {pk},
            created_at TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL
        )
        """,
    ]
    with db() as conn:
        for statement in ddl:
            conn.execute(statement)


init_db()


class ProductLine(BaseModel):
    kind: Literal["product"]
    productSlug: str
    grams: int
    quantity: int = Field(ge=1, le=50)


class BoxLine(BaseModel):
    kind: Literal["box"]
    boxSlug: str
    quantity: int = Field(ge=1, le=50)


class OrderCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=8, max_length=20)
    email: str = Field(max_length=254, pattern=EMAIL_PATTERN)
    address: str = Field(min_length=5, max_length=400)
    city: str = Field(min_length=2, max_length=80)
    pincode: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")
    lines: list[ProductLine | BoxLine] = Field(min_length=1, max_length=40)


def price_line(line: ProductLine | BoxLine) -> int:
    if isinstance(line, BoxLine):
        price = BOX_PRICES.get(line.boxSlug)
        if price is None:
            raise HTTPException(422, f"Unknown box: {line.boxSlug}")
        return price * line.quantity
    prices = PRODUCT_PRICES.get(line.productSlug)
    if prices is None:
        raise HTTPException(422, f"Unknown product: {line.productSlug}")
    unit = prices.get(line.grams)
    if unit is None:
        raise HTTPException(422, f"Unknown weight {line.grams} g for {line.productSlug}")
    return unit * line.quantity


def delivery_window(created: datetime) -> str:
    fmt = "%d %b"
    start = created + timedelta(days=6)
    end = created + timedelta(days=9)
    return f"{start.strftime(fmt)} to {end.strftime(fmt)}"


def stage_info(created: datetime) -> dict:
    age_days = (datetime.now(timezone.utc) - created).total_seconds() / 86400
    current = 0
    for i, (_, threshold) in enumerate(STAGES):
        if age_days >= threshold:
            current = i
    return {
        "currentStage": STAGES[current][0],
        "currentStageIndex": current,
        "stages": [
            {
                "name": name,
                "reached": age_days >= threshold,
                "expected": (created + timedelta(days=threshold)).strftime("%d %b"),
            }
            for name, threshold in STAGES
        ],
    }


# Order emails are optional: configured entirely via env, silently skipped
# when SMTP_PASS is absent. Microsoft 365 mailbox works with these settings:
#   SMTP_HOST=smtp.office365.com  SMTP_PORT=587
#   SMTP_USER=contact@mamayyapickles.com  SMTP_PASS=<mailbox password>
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.office365.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "contact@mamayyapickles.com")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
ORDER_NOTIFY_TO = os.environ.get("ORDER_NOTIFY_TO", SMTP_USER)


def _send_email(to: str, subject: str, body: str) -> None:
    msg = EmailMessage()
    msg["From"] = SMTP_USER
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)


def send_order_emails(order_id: str, payload: "OrderCreate", total: int, window: str) -> None:
    """Fire-and-forget: never blocks or fails the order request."""
    if not SMTP_PASS:
        return

    customer_body = (
        f"Namaste {payload.name},\n\n"
        f"Your Mamayya Pickles order {order_id} is confirmed.\n\n"
        f"Total: Rs. {total:,}\n"
        f"Estimated delivery: {window}\n\n"
        "Fresh preparation starts now and takes 2-3 days, then 4-6 days of shipping.\n"
        f"Track any time: https://mamayyapickles.com/track (order number {order_id})\n\n"
        "Questions? Just reply to this email.\n\n"
        "Mamayya Pickles\n"
        "Big pieces. Bold spice. Proper non-veg pickle."
    )
    owner_body = (
        f"New order {order_id}\n\n"
        f"Name: {payload.name}\nPhone: {payload.phone}\nEmail: {payload.email}\n"
        f"Address: {payload.address}, {payload.city} - {payload.pincode}\n"
        f"Total: Rs. {total:,}\n"
        f"Lines: {json.dumps([line.model_dump() for line in payload.lines], indent=2)}"
    )

    def worker() -> None:
        try:
            _send_email(payload.email, f"Order {order_id} confirmed - Mamayya Pickles", customer_body)
            _send_email(ORDER_NOTIFY_TO, f"New order {order_id} - Rs. {total:,}", owner_body)
        except Exception:
            logger.exception("order email failed for %s", order_id)

    threading.Thread(target=worker, daemon=True).start()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/orders", status_code=201)
def create_order(payload: OrderCreate) -> dict:
    subtotal = sum(price_line(line) for line in payload.lines)
    shipping = 0 if subtotal >= FREE_SHIPPING_THRESHOLD else SHIPPING_FEE
    total = subtotal + shipping
    created = datetime.now(timezone.utc)

    with db() as conn:
        cur = conn.execute(
            _sql(
                """
                INSERT INTO orders
                    (created_at, name, phone, email, address, city, pincode,
                     lines_json, subtotal, shipping, total)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING rowid_pk
                """
            ),
            (
                created.isoformat(),
                payload.name,
                payload.phone,
                payload.email,
                payload.address,
                payload.city,
                payload.pincode,
                json.dumps([line.model_dump() for line in payload.lines]),
                subtotal,
                shipping,
                total,
            ),
        )
        row_id = cur.fetchone()["rowid_pk"]
        order_id = f"MP-{1000 + row_id}"
        conn.execute(
            _sql("UPDATE orders SET order_id = %s WHERE rowid_pk = %s"),
            (order_id, row_id),
        )

    window = delivery_window(created)
    send_order_emails(order_id, payload, total, window)

    return {
        "orderId": order_id,
        "subtotal": subtotal,
        "shipping": shipping,
        "total": total,
        "deliveryWindow": window,
        "status": "confirmed",
        "paymentNote": "Test order. Payment gateway is not live; no money has moved.",
    }


@app.get("/api/orders/{order_id}")
def get_order(order_id: str) -> dict:
    with db() as conn:
        row = conn.execute(
            _sql("SELECT * FROM orders WHERE order_id = %s"),
            (order_id.strip().upper(),),
        ).fetchone()
    if row is None:
        raise HTTPException(404, "No order found with that number.")
    created = datetime.fromisoformat(row["created_at"])
    return {
        "orderId": row["order_id"],
        "placedOn": created.strftime("%d %b %Y"),
        "name": row["name"],
        "total": row["total"],
        "deliveryWindow": delivery_window(created),
        "lines": json.loads(row["lines_json"]),
        **stage_info(created),
    }


class ContactCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(max_length=254, pattern=EMAIL_PATTERN)
    message: str = Field(min_length=5, max_length=4000)


@app.post("/api/contact", status_code=201)
def create_contact(payload: ContactCreate) -> dict:
    with db() as conn:
        conn.execute(
            _sql(
                "INSERT INTO contact_messages (created_at, name, email, message)"
                " VALUES (%s, %s, %s, %s)"
            ),
            (datetime.now(timezone.utc).isoformat(), payload.name, payload.email, payload.message),
        )
    return {"status": "received"}
