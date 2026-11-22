"""API tests for backend/main.py.

SQLite, no network: Razorpay order creation and email delivery are stubbed.
Run from the repository root:  pytest backend/tests
"""

import hashlib
import hmac
import importlib.util
import json
import sys
from datetime import UTC, datetime
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

MAIN = Path(__file__).resolve().parents[1] / "main.py"
ENV_KEYS = (
    "DATABASE_URL",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
    "RESEND_API_KEY",
    "SMTP_PASS",
    "REQUIRE_PAYMENTS",
    "MAMAYYA_DB_PATH",
)
KEY_SECRET = "test-secret"
WEBHOOK_SECRET = "webhook-secret"

ORDER = {
    "name": "Dummy Customer",
    "phone": "+91 90000 00000",
    "email": "dummy@example.invalid",
    "address": "1 Test Lane, Test Nagar",
    "city": "Testville",
    "pincode": "560001",
    "lines": [{"kind": "box", "boxSlug": "family-box", "quantity": 1}],
}


def load_app(tmp_path, monkeypatch, name, **env):
    for key in ENV_KEYS:
        monkeypatch.delenv(key, raising=False)
    monkeypatch.setenv("MAMAYYA_DB_PATH", str(tmp_path / f"{name}.db"))
    for key, value in env.items():
        monkeypatch.setenv(key, value)
    spec = importlib.util.spec_from_file_location(name, MAIN)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def stub_side_effects(module, monkeypatch):
    """No network: Razorpay returns a fixed order id, emails are recorded."""
    sent: list[tuple[str, str, str]] = []
    monkeypatch.setattr(module, "razorpay_create_order", lambda amount, receipt: f"order_{receipt}")
    monkeypatch.setattr(module, "_send_async", lambda job, label: job())
    monkeypatch.setattr(
        module,
        "_send_email",
        lambda to, subject, body, html=None: sent.append((to, subject, body)),
    )
    monkeypatch.setattr(module, "EMAIL_ENABLED", True)
    return sent


@pytest.fixture
def test_mode(tmp_path, monkeypatch):
    """Local development shape: no Razorpay keys, REQUIRE_PAYMENTS off."""
    module = load_app(tmp_path, monkeypatch, "main_test_mode", REQUIRE_PAYMENTS="false")
    sent = stub_side_effects(module, monkeypatch)
    return module, TestClient(module.app), sent


@pytest.fixture
def live_mode(tmp_path, monkeypatch):
    """Production shape: Razorpay keys present, payments required, webhook on."""
    module = load_app(
        tmp_path,
        monkeypatch,
        "main_live_mode",
        REQUIRE_PAYMENTS="true",
        RAZORPAY_KEY_ID="rzp_test_dummy",
        RAZORPAY_KEY_SECRET=KEY_SECRET,
        RAZORPAY_WEBHOOK_SECRET=WEBHOOK_SECRET,
    )
    sent = stub_side_effects(module, monkeypatch)
    return module, TestClient(module.app), sent


def signature(order_id: str, payment_id: str) -> str:
    return hmac.new(KEY_SECRET.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()


def webhook_body(rzp_order_id: str, payment_id: str, event="payment.captured") -> bytes:
    return json.dumps(
        {"event": event, "payload": {"payment": {"entity": {"id": payment_id, "order_id": rzp_order_id}}}}
    ).encode()


def webhook_sig(raw: bytes) -> str:
    return hmac.new(WEBHOOK_SECRET.encode(), raw, hashlib.sha256).hexdigest()


def reset_limiter(module):
    with module._rate_lock:
        module._rate_buckets.clear()


def row(module, order_id):
    with module.db() as conn:
        return conn.execute(module._sql("SELECT * FROM orders WHERE order_id = %s"), (order_id,)).fetchone()


# ---------------------------------------------------------------- start-up guards


def test_refuses_to_start_without_keys_when_payments_required(tmp_path, monkeypatch):
    with pytest.raises(RuntimeError, match="REQUIRE_PAYMENTS"):
        load_app(tmp_path, monkeypatch, "main_fail_closed", REQUIRE_PAYMENTS="true")


def test_refuses_non_postgres_database_url(tmp_path, monkeypatch):
    with pytest.raises(RuntimeError, match="DATABASE_URL"):
        load_app(tmp_path, monkeypatch, "main_bad_db", DATABASE_URL="mysql://user@host/db", REQUIRE_PAYMENTS="false")


# ---------------------------------------------------------------- orders


def test_pricing_and_shipping_are_server_side(test_mode):
    _, client, _ = test_mode
    res = client.post("/api/orders", json=ORDER)
    assert res.status_code == 201
    body = res.json()
    assert (body["subtotal"], body["shipping"], body["total"]) == (1399, 0, 1399)
    assert body["paymentStatus"] == "test"
    assert body["orderId"].startswith("MP-")

    small = dict(ORDER, lines=[{"kind": "product", "productSlug": "chicken-pickle", "grams": 250, "quantity": 1}])
    body = client.post("/api/orders", json=small).json()
    assert (body["subtotal"], body["shipping"], body["total"]) == (349, 99, 448)


def test_input_bounds(test_mode):
    _, client, _ = test_mode
    assert client.post("/api/orders", json=dict(ORDER, phone="call me back")).status_code == 422
    assert client.post("/api/orders", json=dict(ORDER, name="Two\nLines")).status_code == 422
    assert client.post("/api/orders", json=dict(ORDER, address="Line one\r\nLine two here")).status_code == 422
    assert (
        client.post(
            "/api/orders",
            json=dict(ORDER, lines=[{"kind": "product", "productSlug": "x" * 65, "grams": 250, "quantity": 1}]),
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/orders",
            json=dict(ORDER, lines=[{"kind": "product", "productSlug": "chicken-pickle", "grams": 123, "quantity": 1}]),
        ).status_code
        == 422
    )
    assert client.post("/api/orders", json=dict(ORDER, name="n" * (70 * 1024))).status_code == 413


def test_lookup_requires_matching_phone(test_mode):
    _, client, _ = test_mode
    oid = client.post("/api/orders", json=ORDER).json()["orderId"]
    assert client.get(f"/api/orders/{oid}", params={"phone": "9000000000"}).status_code == 200
    assert client.get(f"/api/orders/{oid}", params={"phone": "9000000001"}).status_code == 404
    assert client.get(f"/api/orders/{oid}", params={"phone": "x"}).status_code == 404
    assert client.get("/api/orders/MP-999999", params={"phone": "9000000000"}).status_code == 404


def test_rate_limit_applies_per_client(test_mode):
    _, client, _ = test_mode
    codes = [client.post("/api/orders", json=ORDER).status_code for _ in range(25)]
    assert codes[0] == 201 and 429 in codes


def test_public_config_is_minimal(test_mode):
    _, client, _ = test_mode
    body = client.get("/api/config").json()
    assert set(body) == {"paymentsEnabled", "razorpayKeyId", "emailConfigured"}


def test_health_endpoints(test_mode):
    _, client, _ = test_mode
    assert client.get("/health").json() == {"status": "ok"}
    assert client.get("/health/db").json() == {"status": "ok", "database": "ok"}
    assert client.get("/docs").status_code == 404


def test_security_headers_on_html(test_mode):
    _, client, _ = test_mode
    res = client.get("/api/orders/MP-1/confirm", params={"token": "x"})
    assert res.status_code == 200
    assert res.headers["x-content-type-options"] == "nosniff"
    assert res.headers["referrer-policy"] == "no-referrer"
    assert "frame-ancestors 'none'" in res.headers["content-security-policy"]
    assert res.headers["cache-control"] == "no-store"


# ---------------------------------------------------------------- payments


def test_verify_payment_is_idempotent_and_notifies_kitchen_once(live_mode):
    module, client, sent = live_mode
    created = client.post("/api/orders", json=ORDER).json()
    oid, rzp = created["orderId"], created["razorpayOrderId"]
    assert created["paymentStatus"] == "pending" and rzp == f"order_{oid}"

    bad = {"razorpayOrderId": rzp, "razorpayPaymentId": "pay_1", "razorpaySignature": "0" * 64}
    assert client.post(f"/api/orders/{oid}/verify-payment", json=bad).status_code == 400
    assert client.post(f"/api/orders/{oid}/verify-payment", json=dict(bad, razorpaySignature="é" * 12)).status_code == 400
    assert client.post(f"/api/orders/{oid}/verify-payment", json=dict(bad, razorpayOrderId="order_other")).status_code == 404
    assert client.post("/api/orders/MP-999999/verify-payment", json=bad).status_code == 404
    assert sent == []

    good = dict(bad, razorpaySignature=signature(rzp, "pay_1"))
    assert client.post(f"/api/orders/{oid}/verify-payment", json=good).json() == {"orderId": oid, "paymentStatus": "paid"}
    assert len(sent) == 1 and "[PAID]" in sent[0][1]
    stored = row(module, oid)
    assert stored["payment_status"] == "paid" and stored["razorpay_payment_id"] == "pay_1"

    assert client.post(f"/api/orders/{oid}/verify-payment", json=good).status_code == 200
    assert len(sent) == 1


def test_create_order_is_idempotent_on_retry(live_mode):
    module, client, _ = live_mode
    body = dict(ORDER, idempotencyKey="attempt-abc")
    first = client.post("/api/orders", json=body).json()
    second = client.post("/api/orders", json=body).json()
    assert first["orderId"] == second["orderId"]
    assert first["razorpayOrderId"] == second["razorpayOrderId"]
    with module.db() as conn:
        assert conn.execute("SELECT COUNT(*) AS n FROM orders").fetchone()["n"] == 1


def test_verify_then_webhook_does_not_notify_twice(live_mode):
    _, client, sent = live_mode
    created = client.post("/api/orders", json=ORDER).json()
    oid, rzp = created["orderId"], created["razorpayOrderId"]
    good = {"razorpayOrderId": rzp, "razorpayPaymentId": "pay_1", "razorpaySignature": signature(rzp, "pay_1")}
    assert client.post(f"/api/orders/{oid}/verify-payment", json=good).status_code == 200
    assert len(sent) == 1
    raw = webhook_body(rzp, "pay_1")
    res = client.post("/api/razorpay/webhook", content=raw, headers={"X-Razorpay-Signature": webhook_sig(raw)})
    assert res.json() == {"status": "already_paid", "orderId": oid}
    assert len(sent) == 1


def test_razorpay_failure_leaves_no_orphan_row(live_mode, monkeypatch):
    module, client, _ = live_mode

    def boom(amount, receipt):
        raise module.HTTPException(502, "Payment service is unavailable. Try again.")

    monkeypatch.setattr(module, "razorpay_create_order", boom)
    assert client.post("/api/orders", json=ORDER).status_code == 502
    with module.db() as conn:
        assert conn.execute("SELECT COUNT(*) AS n FROM orders").fetchone()["n"] == 0


def test_same_customer_alert_uses_phone_digits(live_mode):
    _, client, sent = live_mode
    for _ in range(2):
        created = client.post("/api/orders", json=ORDER).json()
        oid, rzp = created["orderId"], created["razorpayOrderId"]
        payload = {"razorpayOrderId": rzp, "razorpayPaymentId": f"pay_{oid}", "razorpaySignature": signature(rzp, f"pay_{oid}")}
        assert client.post(f"/api/orders/{oid}/verify-payment", json=payload).status_code == 200
    assert "SAME CUSTOMER ALERT" not in sent[0][2]
    assert "SAME CUSTOMER ALERT" in sent[1][2]


# ---------------------------------------------------------------- webhook


def test_webhook_marks_paid_once(live_mode):
    module, client, sent = live_mode
    created = client.post("/api/orders", json=ORDER).json()
    oid, rzp = created["orderId"], created["razorpayOrderId"]

    raw = webhook_body(rzp, "pay_hook")
    assert client.post("/api/razorpay/webhook", content=raw, headers={"X-Razorpay-Signature": "0" * 64}).status_code == 400
    assert client.post("/api/razorpay/webhook", content=raw).status_code == 400

    res = client.post("/api/razorpay/webhook", content=raw, headers={"X-Razorpay-Signature": webhook_sig(raw)})
    assert res.json() == {"status": "paid", "orderId": oid}
    assert len(sent) == 1
    assert row(module, oid)["razorpay_payment_id"] == "pay_hook"

    res = client.post("/api/razorpay/webhook", content=raw, headers={"X-Razorpay-Signature": webhook_sig(raw)})
    assert res.json() == {"status": "already_paid", "orderId": oid}
    assert len(sent) == 1

    other = webhook_body("order_nobody", "pay_x", event="order.paid")
    assert client.post("/api/razorpay/webhook", content=other, headers={"X-Razorpay-Signature": webhook_sig(other)}).json() == {"status": "unknown_order"}
    ignored = json.dumps({"event": "refund.created"}).encode()
    assert client.post("/api/razorpay/webhook", content=ignored, headers={"X-Razorpay-Signature": webhook_sig(ignored)}).json()["status"] == "ignored"


def test_webhook_is_exempt_from_per_client_rate_limit(live_mode):
    _, client, _ = live_mode
    raw = webhook_body("order_x", "pay_x")
    codes = {client.post("/api/razorpay/webhook", content=raw, headers={"X-Razorpay-Signature": "bad"}).status_code for _ in range(25)}
    assert codes == {400}


def test_webhook_route_is_off_without_secret(test_mode):
    _, client, _ = test_mode
    assert client.post("/api/razorpay/webhook", content=b"{}", headers={"X-Razorpay-Signature": "x"}).status_code == 404


# ---------------------------------------------------------------- confirm


def test_confirm_two_step_after_payment(live_mode):
    module, client, sent = live_mode
    created = client.post("/api/orders", json=ORDER).json()
    oid, rzp = created["orderId"], created["razorpayOrderId"]
    token = row(module, oid)["confirm_token"]

    unpaid = client.get(f"/api/orders/{oid}/confirm", params={"token": token})
    assert "is not paid" in unpaid.text and "<form" not in unpaid.text

    payload = {"razorpayOrderId": rzp, "razorpayPaymentId": "pay_1", "razorpaySignature": signature(rzp, "pay_1")}
    assert client.post(f"/api/orders/{oid}/verify-payment", json=payload).status_code == 200
    reset_limiter(module)

    page = client.get(f"/api/orders/{oid}/confirm", params={"token": token})
    assert page.status_code == 200 and '<form method="post"' in page.text
    assert row(module, oid)["confirmed_at"] is None

    for bad_token in ("wrong", "é", "töken"):
        for target in (oid, "MP-999999"):
            assert "link isn&#x27;t valid" in client.get(f"/api/orders/{target}/confirm", params={"token": bad_token}).text
            assert "link isn&#x27;t valid" in client.post(f"/api/orders/{target}/confirm", data={"token": bad_token}).text
    reset_limiter(module)

    done = client.post(f"/api/orders/{oid}/confirm", data={"token": token})
    assert done.status_code == 200 and f"{oid} confirmed" in done.text
    assert row(module, oid)["confirmed_at"] is not None
    assert len(sent) == 2 and sent[1][0] == ORDER["email"]

    again = client.post(f"/api/orders/{oid}/confirm", data={"token": token})
    assert "already confirmed" in again.text
    assert len(sent) == 2

    tracked = client.get(f"/api/orders/{oid}", params={"phone": "9000000000"}).json()
    assert tracked["confirmed"] is True and tracked["currentStage"] == "confirmed"


# ---------------------------------------------------------------- helpers


def test_dates_are_rendered_in_ist(test_mode):
    module, _, _ = test_mode
    late_utc = datetime(2026, 11, 22, 20, 0, tzinfo=UTC)  # 01:30 IST on 23 Nov
    assert module.delivery_window(late_utc) == "28 Nov to 30 Nov"
    assert module.stage_info(late_utc)["stages"][0]["expected"] == "23 Nov"


def test_phone_digits_normaliser(test_mode):
    module, _, _ = test_mode
    assert module._phone_digits("+91 90000 00000") == "9000000000"
    assert module._phone_digits("call me back") == ""
    assert module._phone_digits("12345") == ""
