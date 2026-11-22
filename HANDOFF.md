# Mamayya Pickles — Client Handoff

Everything about how this store runs, what's live, and what's left before taking real orders.

## Live URLs

| What | URL |
|------|-----|
| Storefront | https://mamayyapickles.com (HTTPS enforced) |
| Order API | https://mamayya-api.onrender.com (liveness: `/health`, database probe: `/health/db`, status: `/api/config`) |
| Code | https://github.com/Nikhil-AI-Dev/mamayya-pickles |
| Support email | contact@mamayyapickles.com (Microsoft 365 via GoDaddy, webmail at outlook.office.com) |
| Sending email | orders@mamayyapickles.com via Resend (free tier, 100/day) |
| Instagram | https://www.instagram.com/mamayyapickles/ |

## Architecture in one paragraph

The storefront is a static Next.js site, built and deployed automatically by GitHub Actions to GitHub Pages on every push to `master`. The order backend is a FastAPI service on Render (free tier) with a Postgres database; it owns all pricing, creates order numbers (MP-XXXX), sends emails through Resend, and serves order tracking. The cart lives in the shopper's browser (localStorage). No accounts, guest checkout only, prepaid only.

## How an order flows

1. Customer checks out → order stored as **received**; customer sees an on-screen receipt with the MP number but gets **no email yet**
2. **Admin email** arrives at contact@ — packing slip tagged `[PAID]` (or `[UNPAID TEST ORDER]` in local test mode) + a **Confirm order** button (secure per-order link)
3. Admin clicks the button → a page shows the order and a second **Confirm order** button; pressing it (a POST) sends the customer the **branded confirmation email** (from orders@, replies go to contact@) and starts the **one-week delivery clock**. Merely opening the emailed link changes nothing, so mail scanners and link previews cannot confirm an order. Unpaid orders cannot be confirmed in production.
4. Track page (`/track`): needs order number **+ the phone used on the order** (privacy gate). Shows "waiting for kitchen confirmation" until confirmed, then a six-stage timeline anchored to confirmation (delivered day 7). All dates are shown in IST.
5. Payments are live: the customer pays via Razorpay before step 2 — the admin email is sent only after successful payment, which reaches the API by two independent paths: the browser relay (`/verify-payment`) and, as a backstop, the Razorpay **webhook** (`/api/razorpay/webhook`, `payment.captured` / `order.paid`). Either marks the order paid and emails the kitchen; both are idempotent, so a payment is never recorded or notified twice.

Stage timings are calendar estimates (confirm+1 preparing, +3 packed, +4 shipped, +6 out for delivery, +7 delivered), not courier data.

### Razorpay webhook (set this up once)

Razorpay dashboard → Settings → Webhooks → Add: URL `https://mamayya-api.onrender.com/api/razorpay/webhook`, active events `payment.captured` and `order.paid`, set a secret, then paste the same secret into Render → mamayya-api → Environment as `RAZORPAY_WEBHOOK_SECRET`. Without the secret the webhook route is off (returns 404) and only the browser relay records payments.

## Accounts that own things

| Service | Owns | Notes |
|---------|------|-------|
| GoDaddy | Domain + DNS + M365 mailbox | Domain ~$12/yr after year 1; email $7 first year. "Websites+Marketing Lite" ($20.88) is unused — refundable |
| GitHub (Nikhil-AI-Dev) | Code + hosting + deploys | Pages free; HTTPS cert auto-renews (current one to Oct 2026) |
| Render | API hosting | Free web service sleeps when idle (first request ~30s) |
| Neon.tech | Database (Postgres) | Free tier, no expiry. Migrated 21 Jul 2026; connection string in Render env `DATABASE_URL`. SQL Editor in the Neon dashboard for manual queries |
| Resend | Outbound email | Free 100/day; domain verified via DNS (send + resend._domainkey records at GoDaddy) |

## Changing everyday things

Product data: `src/lib/products.ts` (prices, weights, descriptions, ingredients). FAQs: `src/lib/faqs.ts`. Policies: `src/lib/policies.ts`. Public contact details (WhatsApp number, email): `src/app/contact/page.tsx`, `src/components/track/TrackLookup.tsx`. Logo assets: `public/logo.png` (600px) + `public/logo-192.png`. Statutory IDs (FSSAI number, type, holder, validity): `src/lib/business.ts`; the order API mirrors the number via `FSSAI_REG_NO` in Render env (defaults to the same number in `backend/main.py`). Edit, commit, push — site redeploys in ~2 minutes.

Account logins and which identities own which service are kept in a private document, not in this repo (the repo is the public GitHub Pages source).

**Prices exist in TWO places** and must match: `src/lib/products.ts` (what shoppers see) and `backend/main.py` `PRODUCT_PRICES`/`BOX_PRICES` (what orders actually charge). The backend is the authority.

## Emails

- Transport: Resend HTTPS API (`RESEND_API_KEY` on the Render service). Render's free tier blocks SMTP, so don't switch back to SMTP settings while hosted there.
- Customer confirmation: branded card (logo, order stamp, journey strip, track button) sent **on admin confirm**.
- Admin alert: packing slip + Confirm button, to `ORDER_NOTIFY_TO` (defaults to contact@).
- Delivery diagnostics without dashboard access: `GET /api/config` → `lastEmailResult` shows "sent" or a sanitized error.

## Payments (Razorpay — LIVE since 20 Jul 2026)

Live keys are set in Render → mamayya-api → Environment (`RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET`), plus `RAZORPAY_WEBHOOK_SECRET` for the webhook. Customers pay real money; settlements land in the owner's bank T+2 working days, minus ~2% Razorpay fee. (Account login details are in the private account document, not this repo.)

Verified end-to-end on 20 Jul 2026 (test-mode dress run, order MP-1050): checkout → card payment → signature verification → order marked paid → admin email → confirm click → customer email.

Operational notes:
1. Key rotation: dashboard.razorpay.com → Account & Settings → API keys → Regenerate; paste the new pair into Render. Key Secret is shown only once at generation
2. Refunds: Razorpay dashboard → Payments → select payment → Refund (5-7 days to customer)
3. International cards: request activation in Razorpay Settings → Payment methods (off by default; ~3% fees vs 2% domestic; UPI is India-only)
4. Env gotchas seen in practice: a typo'd variable name (`RAZORPAY_KEY_SECRETt`) silently disables payments, and editing env vars can drop `RESEND_API_KEY` (kills all order emails). After any env change, place a test order and check the response includes `razorpayOrderId`

## Security posture

- All queries parameterized; Pydantic validation on every endpoint; server-side pricing
- Order lookup requires order number + matching phone (no enumeration)
- Confirm links use 192-bit tokens, constant-time compared; user-supplied text HTML-escaped in admin email and confirm page
- CORS locked to the production domains; secrets in env only, masked in diagnostics
- Security headers on all API HTML (`nosniff`, `Referrer-Policy: no-referrer`, a strict CSP, and `Cache-Control: no-store` on the token-bearing confirm pages); storefront sends `Referrer-Policy` via meta
- Postgres TLS is required in code (`sslmode=require`), not left to the connection string; a non-`postgres://` `DATABASE_URL` makes the service refuse to start rather than fall back to SQLite
- Full audit run July 2026 (Anthropic security-review rubric): 3 findings, all fixed
- Second audit November 2026 (Cloudflare security-audit skill, source-only): 3 low findings and 7 leads, all addressed in code: `REQUIRE_PAYMENTS` fail-closed start-up (defaults on when `DATABASE_URL` is set; `REQUIRE_PAYMENTS=false` for local dev without keys), two-step confirm (GET page, POST writes), idempotent `verify-payment` with a uniform 404, ten-digit phone required on order and on lookup (constant-time compare), 64 KB body cap and 20 requests/minute per client IP on POSTs and order lookups (last `X-Forwarded-For` hop, the one Render's proxy appends), slugs capped at 64 chars and weights restricted to the catalogue, verified TLS on the SMTP fallback, bounded email worker pool, API docs endpoints disabled, unused `/api/contact` route removed, legacy root `index.html` deleted
- Third review November 2026 (ECC toolkit: FastAPI/React/TypeScript/security reviewers + production audit, each finding independently verified): Razorpay webhook backstop and `razorpay_payment_id` persisted, async confirm route moved off the event loop, Postgres connection pool, pinned Python dependencies with `PYTHON_VERSION`, API test suite wired into CI, cart storage hardened against malformed data with a route error boundary, checkout payment-relay retry made safe (no double charge, survives a reload), IST dates, security headers, and the accessibility fixes above; the storefront's `npm audit` is clean

## Before taking real money — launch blockers

1. ~~FSSAI number~~ — DONE 21 Nov 2026: FSSAI **Registration** No. 21226184001414 (first digit 2 = registration, so the site says "Reg. No.", not "Lic. No."). Lives in `src/lib/business.ts` (footer, product pages, food-safety policy, on-screen receipt, Organization schema) and as the `FSSAI_REG_NO` default in `backend/main.py` (confirmation emails; set the Render env var to override). **Still to do:** print the same number next to the FSSAI logo on every jar label (Labelling & Display Regulations 2020); fill `holder` and `validUntil` in `business.ts` from the certificate; renew at least 30 days before expiry (late renewal fee is ₹100/day)
2. ~~Razorpay activation~~ — DONE 20 Jul 2026, live keys active, flow verified (see Payments)
3. **Real testimonials** — the sample wall is HIDDEN on the live site (commented out in `src/app/page.tsx`) until genuine reviews exist. When real quotes arrive: replace `REACTIONS` in `src/components/home/ReactionWall.tsx` and restore the one commented line in `page.tsx`
4. **Price + copy sign-off** — all prices, weights, shipping (₹99, free above ₹1,200), 12-hour cancellation window, one-week delivery promise: drafted, not client-confirmed
5. ~~Grievance contact~~ — DONE 21 Jul 2026: Subbarayudu Singanamalla named in Terms & Conditions (`src/lib/policies.ts`), linked from Contact page

## Costs to expect

| Item | Cost | When |
|------|------|------|
| Domain renewal | ~$12/yr | Yearly |
| Email renewal | ~$7-70/yr | Yearly (promo first year) |
| Neon Postgres | Free tier (0.5 GB — years of orders) | Done 21 Jul 2026; old Render DB abandoned, expires harmlessly |
| Render always-on API | $7/mo (optional) | If ~30s cold start annoys |
| Razorpay | 2% domestic / ~3% international | Per transaction |
| Resend | Free to 100 emails/day | Upgrade only at volume |
| GitHub Pages | Free | — |

## Operating runbook

- **Site down?** githubstatus.com (Pages) / Render dashboard
- **Deploy failed?** GitHub repo → Actions tab → open the red run (a failed API test blocks the site deploy)
- **Emails not arriving?** Render → mamayya-api → Logs: look for `event=email_sent` / `event=email_failed` lines (full error included); check Resend dashboard → Emails for the delivery log. `GET /api/config` confirms email is configured
- **API healthy but orders failing?** `GET /health/db` runs a real `SELECT 1` and returns 503 if the database is unreachable (plain `/health`, which Render polls, does not touch the database on purpose)
- **API refuses to start after an env change?** Either `REQUIRE_PAYMENTS` is on and a Razorpay key is missing or misnamed, or `DATABASE_URL` is not a `postgres://` URL. Fix the variable in Render → Environment. Render keeps the previous deploy running while the new one fails its health check
- **See orders:** Neon dashboard → project → SQL Editor → `SELECT order_id, created_at, name, phone, total, payment_status, confirmed_at FROM orders ORDER BY rowid_pk DESC;`
- **Daily payment reconciliation** (until you trust the webhook): find captured payments that never reached the kitchen —
  ```sql
  SELECT order_id, created_at, payment_status, confirmed_at, razorpay_order_id, razorpay_payment_id
  FROM orders
  WHERE payment_status IN ('pending','paid') AND confirmed_at IS NULL
    AND razorpay_order_id IS NOT NULL
    AND created_at::timestamptz < now() - interval '2 hours'
  ORDER BY created_at DESC;
  ```
  Cross-check each row against Razorpay dashboard → Payments (the receipt is the MP number). A row that is `pending` but captured in Razorpay means the browser relay was lost; the webhook fixes this automatically once configured.
- **Confirm an order without the email:** the Confirm link format is `https://mamayya-api.onrender.com/api/orders/MP-XXXX/confirm?token=...` — token is in the orders table
- **Local development:** `npm run dev -- -p 3001` for the site; `REQUIRE_PAYMENTS=false python -m uvicorn main:app --port 8001` inside `backend/` for the API (SQLite locally, no setup). Run the API tests with `pip install -r requirements.txt -r requirements-dev.txt && python -m pytest tests`
- **Test orders:** purged via the Neon migration (21 Jul 2026) — the database started fresh. If a stray probe order exists (e.g. MP-1001 'Neon Write Test'), delete it in Neon dashboard → SQL Editor: `DELETE FROM orders WHERE name = 'Neon Write Test';`

## Backup, restore, rollback

- **Site rollback:** `git revert <bad-commit> && git push`, or GitHub → Actions → re-run an earlier green "Deploy" run. The live site is whatever `master` last built.
- **API rollback:** Render dashboard → mamayya-api → Deploys → pick a previous successful deploy → "Rollback". The API also auto-keeps the previous deploy running when a new one fails its health check.
- **Database backup/restore:** Neon keeps point-in-time history on the free tier. Neon dashboard → project → Branches: create a branch from a past timestamp to inspect or restore data, or Restore to roll the main branch back. Before any manual bulk edit in the SQL Editor, create a branch first so it is reversible.
- **Monitoring:** add a free uptime monitor (e.g. UptimeRobot) hitting `https://mamayya-api.onrender.com/health/db` every few minutes with an email alert, so a database outage or bad `DATABASE_URL` is noticed before a customer reports it.
