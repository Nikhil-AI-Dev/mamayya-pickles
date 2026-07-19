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
import secrets
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
from fastapi.responses import HTMLResponse
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
            razorpay_order_id TEXT,
            confirmed_at TEXT,
            confirm_token TEXT
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
        "ALTER TABLE orders ADD COLUMN confirmed_at TEXT",
        "ALTER TABLE orders ADD COLUMN confirm_token TEXT",
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


def delivery_window(anchor: datetime) -> str:
    """Door delivery within one week of kitchen confirmation."""
    fmt = "%d %b"
    start = anchor + timedelta(days=5)
    end = anchor + timedelta(days=7)
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
    name: str, order_id: str, total: int, window: str, items: list[tuple[str, str]]
) -> str:
    import html as html_mod

    safe_name = html_mod.escape(name)
    track_url = f"https://mamayyapickles.com/track?order={order_id}"
    preheader = f"Order {order_id} confirmed. Estimated delivery {window}."
    items_html = "".join(
        f'''<tr>
          <td width="34" style="padding:8px 0;border-bottom:1px solid #f3e9d8;" valign="middle">
            <img src="{img}" width="26" alt="" style="display:block;">
          </td>
          <td style="padding:8px 0 8px 10px;border-bottom:1px solid #f3e9d8;color:#241713;font-size:15px;font-weight:600;" valign="middle">
            {html_mod.escape(label.strip("- ").strip())}
          </td>
        </tr>'''
        for label, img in items
    )
    journey = "".join(
        f'''<td align="center" style="padding:0 2px;">
          <div style="width:26px;height:26px;line-height:26px;border-radius:50%;margin:0 auto;
                      background:{'#a92a1d' if idx == 0 else '#efe3cd'};
                      color:{'#fff4e4' if idx == 0 else '#a89880'};
                      font-size:12px;font-weight:800;">{'&#10003;' if idx == 0 else idx + 1}</div>
          <div style="margin-top:6px;font-size:10px;letter-spacing:0.5px;font-weight:700;
                      color:{'#a92a1d' if idx == 0 else '#a89880'};text-transform:uppercase;">{label}</div>
        </td>'''
        for idx, label in enumerate(["Confirmed", "Preparing", "Packed", "Shipped", "Delivered"])
    )
    return f'''<div style="background:#f3e6d0;padding:36px 12px;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">{preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">

    <tr><td style="background:#241713;border-radius:18px 18px 0 0;padding:24px 32px 20px;" align="center">
      <img src="https://mamayyapickles.com/logo-192.png" width="112" height="112" alt="Mamayya Pickles"
           style="border-radius:50%;display:block;margin:0 auto 12px;">
      <div style="font-size:30px;font-weight:900;color:#e05545;letter-spacing:-1px;">Mamayya
        <span style="font-size:13px;font-weight:800;color:#fff4e4;letter-spacing:5px;">PICKLES</span></div>
      <div style="margin-top:5px;font-size:11px;font-weight:700;letter-spacing:3px;color:#e6a62f;">
        TASTE OF RAYALASEEMA</div>
    </td></tr>

    <tr><td style="background:#a92a1d;padding:34px 32px;" align="center">
      <div style="font-size:15px;color:#fdd9c4;">Namaste {safe_name},</div>
      <div style="margin-top:8px;font-size:30px;line-height:1.15;font-weight:900;color:#fff4e4;">
        Your jars are<br>on the way to the kitchen.</div>
      <div style="display:inline-block;margin-top:18px;background:#fff4e4;border-radius:999px;padding:9px 22px;
                  font-size:15px;font-weight:900;color:#241713;letter-spacing:1px;">ORDER &nbsp;{order_id}</div>
    </td></tr>

    <tr><td style="background:#fff4e4;padding:28px 32px 8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>{journey}</tr></table>
    </td></tr>

    <tr><td style="background:#fff4e4;padding:22px 32px 6px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border:1px solid #eadfc8;border-radius:14px;">
        <tr><td style="padding:18px 22px 6px;">
          <div style="font-size:11px;font-weight:800;letter-spacing:2.5px;color:#b3a086;">YOUR JARS</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;">
            {items_html}
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 14px;">
            <tr>
              <td style="font-size:15px;color:#241713;padding-top:8px;font-weight:700;">Total</td>
              <td align="right" style="font-size:24px;font-weight:900;color:#a92a1d;padding-top:8px;">Rs. {total:,}</td>
            </tr>
            <tr>
              <td style="font-size:14px;color:#6f5d4e;padding-top:2px;">Estimated delivery</td>
              <td align="right" style="font-size:14px;font-weight:800;color:#241713;padding-top:2px;">{window}</td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>

    <tr><td style="background:#fff4e4;padding:18px 32px 6px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="background:#fbf3e2;border-left:4px solid #e6a62f;border-radius:0 10px 10px 0;">
        <tr><td style="padding:14px 18px;font-size:13px;line-height:1.6;color:#5c4a3a;">
          Every batch is cooked fresh after you order - 2-3 days in the kitchen,
          then 4-6 days with the courier. Good pickle takes a little time.
        </td></tr>
      </table>
    </td></tr>

    <tr><td style="background:#fff4e4;padding:24px 32px 30px;" align="center">
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr><td style="background:#241713;border-radius:999px;" align="center">
          <a href="{track_url}"
             style="display:inline-block;padding:15px 42px;color:#fff4e4;font-size:16px;font-weight:800;text-decoration:none;">
            Track your order &rarr;
          </a>
        </td></tr>
      </table>
      <div style="margin-top:14px;font-size:12px;color:#9c8a76;">
        Keep your phone handy - the tracking page asks for the number used on this order.
      </div>
    </td></tr>

    <tr><td style="background:#241713;border-radius:0 0 18px 18px;padding:22px 32px;" align="center">
      <div style="font-size:14px;font-weight:800;color:#fff4e4;">Big pieces. Bold spice. Proper non-veg pickle.</div>
      <div style="margin-top:5px;font-size:12px;color:#e6a62f;">Intlo chesina ruchi. India motham delivery.</div>
      <div style="margin-top:12px;font-size:11px;color:#8d7b6c;">
        Questions? Reply to this email or write to contact@mamayyapickles.com</div>
    </td></tr>

  </table>
</div>'''


API_PUBLIC_URL = os.environ.get("API_PUBLIC_URL", "https://mamayya-api.onrender.com")

ITEM_IMAGES = {
    "chicken-pickle": "https://mamayyapickles.com/jar-chicken.webp",
    "mutton-pickle": "https://mamayyapickles.com/jar-mutton.webp",
    "fish-pickle": "https://mamayyapickles.com/jar-fish.webp",
    "shrimp-pickle": "https://mamayyapickles.com/jar-shrimp.webp",
}

ITEM_NAMES = {
    "chicken-pickle": "Chicken Pickle",
    "mutton-pickle": "Mutton Pickle",
    "fish-pickle": "Fish Pickle",
    "shrimp-pickle": "Prawn Pickle",
    "tasting-box": "Mamayya Tasting Box",
    "family-box": "Family Box",
    "coastal-box": "Coastal Box",
    "full-mamayya-box": "Full Mamayya Box",
}


def format_item_lines(payload: "OrderCreate") -> list[str]:
    lines = []
    for line in payload.lines:
        if isinstance(line, BoxLine):
            name = ITEM_NAMES.get(line.boxSlug, line.boxSlug)
            lines.append(f"  - {line.quantity} x {name}")
        else:
            name = ITEM_NAMES.get(line.productSlug, line.productSlug)
            weight = f"{line.grams // 1000} kg" if line.grams >= 1000 else f"{line.grams} g"
            lines.append(f"  - {line.quantity} x {name} ({weight})")
    return lines


LOGO_URL = "https://mamayyapickles.com/logo-192.png"


def format_item_pairs(payload: "OrderCreate") -> list[tuple[str, str]]:
    """(label, thumbnail-url) pairs for HTML email item rows."""
    pairs = []
    for line in payload.lines:
        if isinstance(line, BoxLine):
            name = ITEM_NAMES.get(line.boxSlug, line.boxSlug)
            pairs.append((f"{line.quantity} x {name}", LOGO_URL))
        else:
            name = ITEM_NAMES.get(line.productSlug, line.productSlug)
            weight = f"{line.grams // 1000} kg" if line.grams >= 1000 else f"{line.grams} g"
            pairs.append(
                (f"{line.quantity} x {name} ({weight})",
                 ITEM_IMAGES.get(line.productSlug, LOGO_URL))
            )
    return pairs


def _send_async(job) -> None:
    """Run an email job on a background thread; record outcome, never raise."""

    def worker() -> None:
        try:
            job()
            _email_state["lastResult"] = "sent"
        except Exception as exc:
            logger.exception("email job failed")
            detail = str(exc)[:300]
            for secret_val in (SMTP_PASS, RESEND_API_KEY):
                if secret_val:
                    detail = detail.replace(secret_val, "***")
            _email_state["lastResult"] = f"{type(exc).__name__}: {detail}"
            _email_state["lastErrorAt"] = datetime.now(timezone.utc).isoformat()

    threading.Thread(target=worker, daemon=True).start()


def send_admin_new_order_email(
    order_id: str, payload: "OrderCreate", total: int, confirm_token: str
) -> None:
    """Packing slip + one-click Confirm button. Sent when an order arrives."""
    if not EMAIL_ENABLED:
        return
    item_lines = format_item_lines(payload)
    confirm_url = f"{API_PUBLIC_URL}/api/orders/{order_id}/confirm?token={confirm_token}"
    body = (
        f"New order {order_id} - awaiting your confirmation\n\n"
        f"Name: {payload.name}\n"
        f"Phone: {payload.phone}\n"
        f"Email: {payload.email}\n"
        f"Address: {payload.address}, {payload.city} - {payload.pincode}\n\n"
        "Items:\n" + "\n".join(item_lines) + "\n\n"
        f"Total: Rs. {total:,}\n\n"
        "The customer has NOT been emailed yet. Confirm to start the one-week\n"
        "delivery clock and send their confirmation email:\n"
        f"{confirm_url}"
    )
    import html as html_mod

    esc = html_mod.escape
    html = f"""\
<div style="background:#f3e6d0;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td style="background:#241713;border-radius:14px 14px 0 0;padding:14px 24px;">
      <img src="https://mamayyapickles.com/logo-192.png" width="40" height="40" alt=""
           style="border-radius:50%;vertical-align:middle;margin-right:10px;">
      <span style="color:#e05545;font-size:22px;font-weight:900;vertical-align:middle;">Mamayya</span>
      <span style="color:#fff4e4;font-size:12px;font-weight:800;letter-spacing:3px;vertical-align:middle;"> PICKLES &nbsp;&bull;&nbsp; KITCHEN</span>
    </td></tr>
    <tr><td style="background:#fff4e4;padding:24px;">
      <h1 style="margin:0 0 4px;color:#241713;font-size:20px;font-weight:900;">New order {order_id}</h1>
      <p style="margin:0 0 16px;color:#a92a1d;font-size:13px;font-weight:700;">
        Awaiting your confirmation - customer not emailed yet.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border:1px solid #eadfc8;border-radius:10px;">
        <tr><td style="padding:14px 18px;font-size:14px;line-height:1.8;color:#241713;">
          <strong>{esc(payload.name)}</strong><br>
          {esc(payload.phone)} &nbsp;&bull;&nbsp; {esc(payload.email)}<br>
          {esc(payload.address)}, {esc(payload.city)} - {esc(payload.pincode)}<br><br>
          {"<br>".join(line.strip("- ").strip() for line in item_lines)}<br><br>
          <strong style="color:#a92a1d;font-size:17px;">Total: Rs. {total:,}</strong>
        </td></tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px auto 4px;">
        <tr><td style="background:#a92a1d;border-radius:999px;" align="center">
          <a href="{confirm_url}"
             style="display:inline-block;padding:14px 38px;color:#fff4e4;font-size:16px;font-weight:800;text-decoration:none;">
            Confirm order &#10003;
          </a>
        </td></tr>
      </table>
      <p style="margin:10px 0 0;color:#9c8a76;font-size:12px;" align="center">
        Confirming emails the customer and starts the one-week delivery clock.</p>
    </td></tr>
  </table>
</div>"""
    _send_async(
        lambda: _send_email(
            ORDER_NOTIFY_TO,
            f"New order {order_id} - Rs. {total:,} - confirm to accept",
            body,
            html=html,
        )
    )


def send_customer_confirmation_email(
    order_id: str, payload: "OrderCreate", total: int, window: str
) -> None:
    """Branded confirmation. Sent only after the kitchen confirms the order."""
    if not EMAIL_ENABLED:
        return
    item_lines = format_item_lines(payload)
    body = (
        f"Namaste {payload.name},\n\n"
        f"Your Mamayya Pickles order {order_id} is confirmed.\n\n"
        "Your jars:\n" + "\n".join(item_lines) + "\n\n"
        f"Total: Rs. {total:,}\n"
        f"Estimated delivery: {window}\n\n"
        "Fresh preparation starts now - your jars reach your door within a week.\n"
        f"Track any time: https://mamayyapickles.com/track?order={order_id}\n\n"
        "Questions? Just reply to this email.\n\n"
        "Mamayya Pickles\n"
        "Big pieces. Bold spice. Proper non-veg pickle."
    )
    html = customer_email_html(payload.name, order_id, total, window, format_item_pairs(payload))
    _send_async(
        lambda: _send_email(
            payload.email,
            f"Order {order_id} confirmed - Mamayya Pickles",
            body,
            html=html,
        )
    )


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
    confirm_token = secrets.token_urlsafe(24)

    with db() as conn:
        cur = conn.execute(
            _sql(
                """
                INSERT INTO orders
                    (created_at, name, phone, email, address, city, pincode,
                     lines_json, subtotal, shipping, total, payment_status,
                     confirm_token)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
                confirm_token,
            ),
        )
        row_id = cur.fetchone()["rowid_pk"]
        order_id = f"MP-{1000 + row_id}"
        conn.execute(
            _sql("UPDATE orders SET order_id = %s WHERE rowid_pk = %s"),
            (order_id, row_id),
        )

    response = {
        "orderId": order_id,
        "subtotal": subtotal,
        "shipping": shipping,
        "total": total,
        "status": "received",
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
        response["paymentNote"] = "Complete the payment to place your order."
        # Admin is notified after successful payment (see verify endpoint).
    else:
        response["paymentNote"] = (
            "Order received. The kitchen will confirm it shortly - "
            "your confirmation email arrives then."
        )
        send_admin_new_order_email(order_id, payload, total, confirm_token)

    return response


@app.get("/api/orders/{order_id}/confirm", response_class=HTMLResponse)
def confirm_order(order_id: str, token: str = "") -> str:
    """One-click kitchen confirmation from the admin email."""
    with db() as conn:
        row = conn.execute(
            _sql("SELECT * FROM orders WHERE order_id = %s"),
            (order_id.strip().upper(),),
        ).fetchone()
    if (
        row is None
        or not token
        or not row["confirm_token"]
        or not hmac.compare_digest(str(row["confirm_token"]), token)
    ):
        raise HTTPException(404, "Unknown order or invalid confirmation link.")

    def page(title: str, detail: str) -> str:
        return f"""<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title></head>
<body style="margin:0;background:#fff4e4;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:460px;margin:80px auto;padding:36px;background:#ffffff;
            border:1px solid #eadfc8;border-radius:18px;text-align:center;">
  <div style="font-size:26px;font-weight:900;color:#a92a1d;">Mamayya
    <span style="font-size:12px;font-weight:800;color:#241713;letter-spacing:4px;">PICKLES</span></div>
  <h1 style="margin:22px 0 8px;font-size:22px;color:#241713;">{title}</h1>
  <p style="margin:0;color:#6f5d4e;font-size:15px;line-height:1.6;">{detail}</p>
</div></body></html>"""

    if row["confirmed_at"]:
        return page(
            f"{row['order_id']} was already confirmed",
            "The customer has their confirmation email. Nothing more to do.",
        )

    confirmed = datetime.now(timezone.utc)
    with db() as conn:
        conn.execute(
            _sql("UPDATE orders SET confirmed_at = %s WHERE order_id = %s"),
            (confirmed.isoformat(), row["order_id"]),
        )

    order_payload = OrderCreate(
        name=row["name"],
        phone=row["phone"],
        email=row["email"],
        address=row["address"],
        city=row["city"],
        pincode=row["pincode"],
        lines=json.loads(row["lines_json"]),
    )
    send_customer_confirmation_email(
        row["order_id"], order_payload, row["total"], delivery_window(confirmed)
    )
    import html as html_mod

    return page(
        f"{row['order_id']} confirmed",
        f"{html_mod.escape(row['name'])} has been emailed. The one-week delivery "
        f"clock started now - door delivery by {delivery_window(confirmed)}.",
    )


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

    order_payload = OrderCreate(
        name=row["name"],
        phone=row["phone"],
        email=row["email"],
        address=row["address"],
        city=row["city"],
        pincode=row["pincode"],
        lines=json.loads(row["lines_json"]),
    )
    # Payment captured: now the kitchen decides. Customer email waits for confirm.
    send_admin_new_order_email(
        row["order_id"], order_payload, row["total"], row["confirm_token"]
    )
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
    confirmed_raw = row["confirmed_at"]
    base = {
        "orderId": row["order_id"],
        "placedOn": created.strftime("%d %b %Y"),
        "name": row["name"],
        "total": row["total"],
        "lines": json.loads(row["lines_json"]),
        "paymentStatus": row["payment_status"],
        "confirmed": bool(confirmed_raw),
    }
    if not confirmed_raw:
        # Kitchen hasn't accepted yet: the delivery clock hasn't started.
        return {
            **base,
            "deliveryWindow": "Within a week of confirmation",
            "currentStage": "received",
            "currentStageIndex": -1,
            "stages": [
                {"name": name, "reached": False, "expected": ""}
                for name, _ in STAGES
            ],
        }
    confirmed = datetime.fromisoformat(confirmed_raw)
    return {
        **base,
        "deliveryWindow": delivery_window(confirmed),
        **stage_info(confirmed),
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
