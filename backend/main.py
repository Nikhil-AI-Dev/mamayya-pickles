"""Mamayya Pickles order API.

Single-file FastAPI backend: orders (server-side pricing), order tracking,
contact messages. SQLite storage next to this file. Payment gateway is not
integrated; orders are stored as test orders.

Run:  uvicorn main:app --port 8001 --reload  (from the backend/ directory)
"""

import base64
import hashlib
import hmac
import json
import logging
import os
import smtplib
import sqlite3
import threading
import urllib.error
import urllib.request
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


# Razorpay: payments switch on when both keys are present, otherwise every
# order is stored as a test order exactly as before.
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
PAYMENTS_ENABLED = bool(RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)


def razorpay_create_order(amount_inr: int, receipt: str) -> str:
    """Create a Razorpay order, return its id. Amount is rupees; API wants paise."""
    auth = base64.b64encode(
        f"{RAZORPAY_KEY_ID}:{RAZORPAY_KEY_SECRET}".encode()
    ).decode()
    req = urllib.request.Request(
        "https://api.razorpay.com/v1/orders",
        data=json.dumps(
            {"amount": amount_inr * 100, "currency": "INR", "receipt": receipt}
        ).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Basic {auth}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            return json.loads(res.read())["id"]
    except urllib.error.URLError as exc:
        logger.exception("razorpay order create failed")
        raise HTTPException(502, "Payment service is unavailable. Try again.") from exc


def razorpay_signature_valid(order_id: str, payment_id: str, signature: str) -> bool:
    expected = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        f"{order_id}|{payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)

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
            total INTEGER NOT NULL,
            payment_status TEXT NOT NULL DEFAULT 'test',
            razorpay_order_id TEXT
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
    # Columns added after the first production deploy; harmless when present.
    for column_ddl in (
        "ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'test'",
        "ALTER TABLE orders ADD COLUMN razorpay_order_id TEXT",
    ):
        try:
            with db() as conn:
                conn.execute(column_ddl)
        except Exception:
            pass  # column already exists


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


# Order emails are optional and configured entirely via env.
# Preferred transport: Resend HTTPS API (RESEND_API_KEY) - required on Render,
# whose free tier blocks outbound SMTP. SMTP settings remain as a fallback
# for hosts that allow it.
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
EMAIL_FROM = os.environ.get("EMAIL_FROM", "Mamayya Pickles <orders@mamayyapickles.com>")
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.office365.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "contact@mamayyapickles.com")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
ORDER_NOTIFY_TO = os.environ.get("ORDER_NOTIFY_TO", "contact@mamayyapickles.com")
EMAIL_ENABLED = bool(RESEND_API_KEY or SMTP_PASS)

# Last email delivery outcome, surfaced (sanitized) in /api/config so mail
# problems can be diagnosed without dashboard access. Never contains secrets.
_email_state: dict = {"lastResult": None, "lastErrorAt": None}


def _send_email(to: str, subject: str, body: str, html: str | None = None) -> None:
    if RESEND_API_KEY:
        payload: dict = {
            "from": EMAIL_FROM,
            "to": [to],
            "reply_to": ORDER_NOTIFY_TO,
            "subject": subject,
            "text": body,
        }
        if html:
            payload["html"] = html
        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=json.dumps(payload).encode(),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {RESEND_API_KEY}",
                # Cloudflare fronts api.resend.com and blocks the default
                # Python-urllib user agent (error 1010).
                "User-Agent": "mamayya-api/1.0 (+https://mamayyapickles.com)",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=20) as res:
                res.read()
        except urllib.error.HTTPError as exc:
            body = exc.read().decode(errors="replace")[:300]
            raise RuntimeError(f"Resend {exc.code}: {body}") from exc
        return
    msg = EmailMessage()
    msg["From"] = SMTP_USER
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    if html:
        msg.add_alternative(html, subtype="html")
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)


def customer_email_html(
    name: str, order_id: str, total: int, window: str, items: list[str]
) -> str:
    import html as html_mod

    safe_name = html_mod.escape(name)
    track_url = f"https://mamayyapickles.com/track?order={order_id}"
    items_html = "".join(
        f'<tr><td style="padding:6px 0;color:#3a2a24;font-size:14px;">{html_mod.escape(i.strip("- ").strip())}</td></tr>'
        for i in items
    )
    return f"""\
<div style="background:#f9e9d2;padding:32px 12px;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td style="background:#241713;border-radius:16px 16px 0 0;padding:20px 28px;">
      <span style="color:#a92a1d;font-size:26px;font-weight:800;">Mamayya</span>
      <span style="color:#fff4e4;font-size:13px;font-weight:700;letter-spacing:3px;"> PICKLES</span>
    </td></tr>
    <tr><td style="background:#fff4e4;padding:28px;">
      <p style="margin:0 0 6px;color:#3a2a24;font-size:15px;">Namaste {safe_name},</p>
      <h1 style="margin:0 0 18px;color:#a92a1d;font-size:24px;font-weight:800;">
        Order {order_id} is confirmed.
      </h1>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border:1px solid #e8dcc8;border-radius:12px;padding:0;">
        <tr><td style="padding:16px 20px 8px;">
          <p style="margin:0 0 8px;color:#8a7a6d;font-size:11px;font-weight:700;letter-spacing:2px;">YOUR JARS</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">{items_html}</table>
        </td></tr>
        <tr><td style="padding:8px 20px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e8dcc8;">
            <tr>
              <td style="padding-top:10px;color:#3a2a24;font-size:14px;">Total</td>
              <td style="padding-top:10px;color:#241713;font-size:18px;font-weight:800;" align="right">Rs. {total:,}</td>
            </tr>
            <tr>
              <td style="padding-top:4px;color:#3a2a24;font-size:14px;">Estimated delivery</td>
              <td style="padding-top:4px;color:#241713;font-size:14px;font-weight:700;" align="right">{window}</td>
            </tr>
          </table>
        </td></tr>
      </table>
      <p style="margin:20px 0 8px;color:#3a2a24;font-size:14px;line-height:1.6;">
        Fresh preparation starts now and takes 2-3 days, then 4-6 days of shipping.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 6px;">
        <tr><td style="background:#a92a1d;border-radius:999px;">
          <a href="{track_url}"
             style="display:inline-block;padding:13px 30px;color:#fff4e4;font-size:15px;font-weight:700;text-decoration:none;">
            Track your order
          </a>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;color:#8a7a6d;font-size:12px;">
        Questions? Just reply to this email.
      </p>
    </td></tr>
    <tr><td style="background:#241713;border-radius:0 0 16px 16px;padding:18px 28px;">
      <p style="margin:0;color:#fff4e4;font-size:13px;font-weight:700;">Big pieces. Bold spice. Proper non-veg pickle.</p>
      <p style="margin:4px 0 0;color:#e6a62f;font-size:12px;">Intlo chesina ruchi. India motham delivery.</p>
    </td></tr>
  </table>
</div>"""


def send_order_emails(order_id: str, payload: "OrderCreate", total: int, window: str) -> None:
    """Fire-and-forget: never blocks or fails the order request."""
    if not EMAIL_ENABLED:
        return

    item_names = {
        "chicken-pickle": "Chicken Pickle",
        "mutton-pickle": "Mutton Pickle",
        "fish-pickle": "Fish Pickle",
        "shrimp-pickle": "Shrimp Pickle",
        "tasting-box": "Mamayya Tasting Box",
        "family-box": "Family Box",
        "coastal-box": "Coastal Box",
        "full-mamayya-box": "Full Mamayya Box",
    }
    item_lines = []
    for line in payload.lines:
        if isinstance(line, BoxLine):
            name = item_names.get(line.boxSlug, line.boxSlug)
            item_lines.append(f"  - {line.quantity} x {name}")
        else:
            name = item_names.get(line.productSlug, line.productSlug)
            weight = f"{line.grams // 1000} kg" if line.grams >= 1000 else f"{line.grams} g"
            item_lines.append(f"  - {line.quantity} x {name} ({weight})")

    owner_body = (
        f"New order {order_id}\n\n"
        f"Name: {payload.name}\n"
        f"Phone: {payload.phone}\n"
        f"Email: {payload.email}\n"
        f"Address: {payload.address}, {payload.city} - {payload.pincode}\n\n"
        "Items:\n" + "\n".join(item_lines) + "\n\n"
        f"Total: Rs. {total:,}\n"
        f"Estimated delivery: {window}"
    )

    customer_body = (
        f"Namaste {payload.name},\n\n"
        f"Your Mamayya Pickles order {order_id} is confirmed.\n\n"
        "Your jars:\n" + "\n".join(item_lines) + "\n\n"
        f"Total: Rs. {total:,}\n"
        f"Estimated delivery: {window}\n\n"
        "Fresh preparation starts now and takes 2-3 days, then 4-6 days of shipping.\n"
        f"Track any time: https://mamayyapickles.com/track?order={order_id}\n\n"
        "Questions? Just reply to this email.\n\n"
        "Mamayya Pickles\n"
        "Big pieces. Bold spice. Proper non-veg pickle."
    )
    customer_html = customer_email_html(payload.name, order_id, total, window, item_lines)

    def worker() -> None:
        try:
            _send_email(
                payload.email,
                f"Order {order_id} confirmed - Mamayya Pickles",
                customer_body,
                html=customer_html,
            )
            _send_email(ORDER_NOTIFY_TO, f"New order {order_id} - Rs. {total:,}", owner_body)
            _email_state["lastResult"] = "sent"
        except Exception as exc:
            logger.exception("order email failed for %s", order_id)
            detail = str(exc)[:300]
            for secret in (SMTP_PASS, RESEND_API_KEY):
                if secret:
                    detail = detail.replace(secret, "***")
            _email_state["lastResult"] = f"{type(exc).__name__}: {detail}"
            _email_state["lastErrorAt"] = datetime.now(timezone.utc).isoformat()

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

    payment_status = "pending" if PAYMENTS_ENABLED else "test"

    with db() as conn:
        cur = conn.execute(
            _sql(
                """
                INSERT INTO orders
                    (created_at, name, phone, email, address, city, pincode,
                     lines_json, subtotal, shipping, total, payment_status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
                payment_status,
            ),
        )
        row_id = cur.fetchone()["rowid_pk"]
        order_id = f"MP-{1000 + row_id}"
        conn.execute(
            _sql("UPDATE orders SET order_id = %s WHERE rowid_pk = %s"),
            (order_id, row_id),
        )

    window = delivery_window(created)

    response = {
        "orderId": order_id,
        "subtotal": subtotal,
        "shipping": shipping,
        "total": total,
        "deliveryWindow": window,
        "status": "confirmed",
        "paymentStatus": payment_status,
    }

    if PAYMENTS_ENABLED:
        rzp_order_id = razorpay_create_order(total, order_id)
        with db() as conn:
            conn.execute(
                _sql("UPDATE orders SET razorpay_order_id = %s WHERE order_id = %s"),
                (rzp_order_id, order_id),
            )
        response["razorpayOrderId"] = rzp_order_id
        response["razorpayKeyId"] = RAZORPAY_KEY_ID
        response["paymentNote"] = "Complete the payment to confirm your order."
        # Confirmation email waits for successful payment (see verify endpoint).
    else:
        response["paymentNote"] = (
            "Test order. Payment gateway is not live; no money has moved."
        )
        send_order_emails(order_id, payload, total, window)

    return response


class PaymentVerify(BaseModel):
    razorpayOrderId: str = Field(min_length=5, max_length=64)
    razorpayPaymentId: str = Field(min_length=5, max_length=64)
    razorpaySignature: str = Field(min_length=10, max_length=256)


@app.post("/api/orders/{order_id}/verify-payment")
def verify_payment(order_id: str, payload: PaymentVerify) -> dict:
    if not PAYMENTS_ENABLED:
        raise HTTPException(400, "Payments are not enabled.")
    with db() as conn:
        row = conn.execute(
            _sql("SELECT * FROM orders WHERE order_id = %s"),
            (order_id.strip().upper(),),
        ).fetchone()
    if row is None:
        raise HTTPException(404, "No order found with that number.")
    if row["razorpay_order_id"] != payload.razorpayOrderId:
        raise HTTPException(400, "Payment does not match this order.")
    if not razorpay_signature_valid(
        payload.razorpayOrderId, payload.razorpayPaymentId, payload.razorpaySignature
    ):
        raise HTTPException(400, "Payment verification failed.")

    with db() as conn:
        conn.execute(
            _sql("UPDATE orders SET payment_status = 'paid' WHERE order_id = %s"),
            (row["order_id"],),
        )

    created = datetime.fromisoformat(row["created_at"])
    order_payload = OrderCreate(
        name=row["name"],
        phone=row["phone"],
        email=row["email"],
        address=row["address"],
        city=row["city"],
        pincode=row["pincode"],
        lines=json.loads(row["lines_json"]),
    )
    send_order_emails(row["order_id"], order_payload, row["total"], delivery_window(created))
    return {"orderId": row["order_id"], "paymentStatus": "paid"}


@app.get("/api/config")
def get_config() -> dict:
    return {
        "paymentsEnabled": PAYMENTS_ENABLED,
        "razorpayKeyId": RAZORPAY_KEY_ID,
        "emailConfigured": EMAIL_ENABLED,
        "emailTransport": "resend" if RESEND_API_KEY else ("smtp" if SMTP_PASS else None),
        "lastEmailResult": _email_state["lastResult"],
    }


def _phone_digits(value: str) -> str:
    return "".join(c for c in value if c.isdigit())[-10:]


@app.get("/api/orders/{order_id}")
def get_order(order_id: str, phone: str = "") -> dict:
    with db() as conn:
        row = conn.execute(
            _sql("SELECT * FROM orders WHERE order_id = %s"),
            (order_id.strip().upper(),),
        ).fetchone()
    # Order numbers are sequential, so the phone used on the order acts as a
    # shared secret: without a match, reveal nothing (including existence).
    if row is None or not phone or _phone_digits(phone) != _phone_digits(row["phone"]):
        raise HTTPException(
            404, "No order found with that number and phone combination."
        )
    created = datetime.fromisoformat(row["created_at"])
    return {
        "orderId": row["order_id"],
        "placedOn": created.strftime("%d %b %Y"),
        "name": row["name"],
        "total": row["total"],
        "deliveryWindow": delivery_window(created),
        "lines": json.loads(row["lines_json"]),
        "paymentStatus": row["payment_status"],
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
