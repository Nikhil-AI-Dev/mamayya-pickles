# Mamayya Pickles — Client Handoff

Everything about how this store runs, what's live, and what's left before taking real orders.

## Live URLs

| What | URL |
|------|-----|
| Storefront | https://mamayyapickles.com (HTTPS enforced) |
| Order API | https://mamayya-api.onrender.com (health: `/health`, status: `/api/config`) |
| Code | https://github.com/Nikhil-AI-Dev/mamayya-pickles |
| Support email | contact@mamayyapickles.com (Microsoft 365 via GoDaddy, webmail at outlook.office.com) |
| Sending email | orders@mamayyapickles.com via Resend (free tier, 100/day) |
| Instagram | https://www.instagram.com/mamayyapickle/ |

## Architecture in one paragraph

The storefront is a static Next.js site, built and deployed automatically by GitHub Actions to GitHub Pages on every push to `master`. The order backend is a FastAPI service on Render (free tier) with a Postgres database; it owns all pricing, creates order numbers (MP-XXXX), sends emails through Resend, and serves order tracking. The cart lives in the shopper's browser (localStorage). No accounts, guest checkout only, prepaid only.

## How an order flows

1. Customer checks out → order stored as **received**; customer sees an on-screen receipt with the MP number but gets **no email yet**
2. **Admin email** arrives at contact@ — packing slip + a one-click **Confirm order** button (secure per-order link)
3. Admin clicks Confirm → customer gets the **branded confirmation email** (from orders@, replies go to contact@) and the **one-week delivery clock starts** from that moment
4. Track page (`/track`): needs order number **+ the phone used on the order** (privacy gate). Shows "waiting for kitchen confirmation" until confirmed, then a six-stage timeline anchored to confirmation (delivered day 7)
5. Payments are live: the customer pays via Razorpay before step 2 — the admin email is sent only after successful payment

Stage timings are calendar estimates (confirm+1 preparing, +3 packed, +4 shipped, +6 out for delivery, +7 delivered), not courier data.

## Accounts that own things

| Service | Owns | Notes |
|---------|------|-------|
| GoDaddy | Domain + DNS + M365 mailbox | Domain ~$12/yr after year 1; email $7 first year. "Websites+Marketing Lite" ($20.88) is unused — refundable |
| GitHub (Nikhil-AI-Dev) | Code + hosting + deploys | Pages free; HTTPS cert auto-renews (current one to Oct 2026) |
| Render | API hosting | Free web service sleeps when idle (first request ~30s) |
| Neon.tech | Database (Postgres) | Free tier, no expiry. Migrated 21 Jul 2026; connection string in Render env `DATABASE_URL`. SQL Editor in the Neon dashboard for manual queries |
| Resend | Outbound email | Free 100/day; domain verified via DNS (send + resend._domainkey records at GoDaddy) |

## Changing everyday things

Product data: `src/lib/products.ts` (prices, weights, descriptions, ingredients). FAQs: `src/lib/faqs.ts`. Policies: `src/lib/policies.ts`. Contacts (WhatsApp +91 90358 43899 - owner's number, also Razorpay login; email): `src/app/contact/page.tsx`, `src/components/track/TrackLookup.tsx`. Logo assets: `public/logo.png` (600px) + `public/logo-192.png`. Edit, commit, push — site redeploys in ~2 minutes.

**Prices exist in TWO places** and must match: `src/lib/products.ts` (what shoppers see) and `backend/main.py` `PRODUCT_PRICES`/`BOX_PRICES` (what orders actually charge). The backend is the authority.

## Emails

- Transport: Resend HTTPS API (`RESEND_API_KEY` on the Render service). Render's free tier blocks SMTP, so don't switch back to SMTP settings while hosted there.
- Customer confirmation: branded card (logo, order stamp, journey strip, track button) sent **on admin confirm**.
- Admin alert: packing slip + Confirm button, to `ORDER_NOTIFY_TO` (defaults to contact@).
- Delivery diagnostics without dashboard access: `GET /api/config` → `lastEmailResult` shows "sent" or a sanitized error.

## Payments (Razorpay — LIVE since 20 Jul 2026)

Account: created with the owner's details, login contact@mamayyapickles.com. Live keys are set in Render → mamayya-api → Environment (`RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET`). Customers pay real money; settlements land in the owner's bank T+2 working days, minus ~2% Razorpay fee.

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
- Full audit run July 2026 (Anthropic security-review rubric): 3 findings, all fixed

## Before taking real money — launch blockers

1. **FSSAI licence number** — legally required. Replace placeholder in `src/components/Footer.tsx` and `src/lib/policies.ts` (food-safety). Also goes on jar labels
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
- **Deploy failed?** GitHub repo → Actions tab → open the red run
- **Emails not arriving?** `GET https://mamayya-api.onrender.com/api/config` → `lastEmailResult` has the error; check Resend dashboard → Emails for delivery log
- **See orders:** Neon dashboard → project → SQL Editor → `SELECT order_id, created_at, name, phone, total, payment_status, confirmed_at FROM orders ORDER BY rowid_pk DESC;`
- **Confirm an order without the email:** the Confirm link format is `https://mamayya-api.onrender.com/api/orders/MP-XXXX/confirm?token=...` — token is in the orders table
- **Local development:** `npm run dev -- -p 3001` for the site; `python -m uvicorn main:app --port 8001` inside `backend/` for the API (SQLite locally, no setup)
- **Test orders:** purged via the Neon migration (21 Jul 2026) — the database started fresh. If a stray probe order exists (e.g. MP-1001 'Neon Write Test'), delete it in Neon dashboard → SQL Editor: `DELETE FROM orders WHERE name = 'Neon Write Test';`
