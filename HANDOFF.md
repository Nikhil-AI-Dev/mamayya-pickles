# Mamayya Pickles — Client Handoff

Everything about how this store runs, what's live, and what's left before taking real orders.

## Live URLs

| What | URL |
|------|-----|
| Storefront | https://mamayyapickles.com |
| Order API | https://mamayya-api.onrender.com (health: `/health`) |
| Code | https://github.com/Nikhil-AI-Dev/mamayya-pickles |
| Support email | contact@mamayyapickles.com (Microsoft 365 via GoDaddy) |

## Architecture in one paragraph

The storefront is a static Next.js site, built and deployed automatically by GitHub Actions to GitHub Pages on every push to `master`. The order backend is a FastAPI service on Render (free tier) with a Postgres database; it owns all pricing, creates order numbers (MP-XXXX), and serves order tracking. The cart lives in the shopper's browser (localStorage). No accounts, guest checkout only, prepaid only.

## Accounts that own things

| Service | Owns | Notes |
|---------|------|-------|
| GoDaddy | Domain + DNS + mailbox | Renewals: domain ~$12/yr after year 1, email $7/yr promo |
| GitHub (Nikhil-AI-Dev) | Code + hosting + deploys | Pages is free |
| Render | API + database | Free tier: API sleeps when idle (first request ~30s), **free Postgres expires after 30 days** — see Costs |

## Changing everyday things

All product data lives in one file: `src/lib/products.ts` — prices, weights, descriptions, spice levels, ingredients, nutrition. FAQs: `src/lib/faqs.ts`. Policies: `src/lib/policies.ts`. Edit, commit, push — the site redeploys itself in ~2 minutes.

**Prices exist in TWO places** and must match: `src/lib/products.ts` (what shoppers see) and `backend/main.py` `PRODUCT_PRICES`/`BOX_PRICES` (what orders actually charge). The backend is the authority.

## Orders

- Every order gets an MP-XXXX number, stored in Render Postgres.
- Customers track at `/track` with that number. Stages are time-based estimates (confirmed → preparing day 1 → packed day 3 → shipped day 4 → out for delivery day 6 → delivered day 7).
- **Order emails**: once `SMTP_PASS` (the contact@ mailbox password) is set in Render → mamayya-api → Environment, every order sends a confirmation to the customer and a notification to contact@mamayyapickles.com. Until then, orders are visible only in the database.

## Before taking real money — launch blockers

1. **FSSAI licence number** — legally required to sell food online in India. Replace the `XXXXXXXXXXXXXX` placeholder in `src/components/Footer.tsx` and `src/lib/policies.ts` (food-safety section). Also goes on jar labels.
2. **Razorpay** — payment gateway not connected; the site currently records test orders and says so honestly. Client signs up at dashboard.razorpay.com (needs Indian phone OTP, business PAN, bank account). International cards possible after requesting activation in Razorpay settings; UPI is domestic-only.
3. **Real testimonials** — the "Mamayya Wall" on the home page shows sample reactions marked as placeholders (`src/components/home/ReactionWall.tsx`). Replace with real customer content or remove the section. Fake reviews violate consumer protection rules.
4. **Price + copy sign-off** — every price, weight, delivery promise (7 days, ₹99 shipping, free above ₹1,200, 12-hour cancellation window) was drafted for the client to confirm, not confirmed by them.
5. **Grievance contact** — Indian e-commerce rules require a named grievance officer + contact; add to Terms page once known.

## Costs to expect

| Item | Cost | When |
|------|------|------|
| Domain renewal | ~$12/yr | Yearly (first year was $1 promo) |
| Email renewal | ~$7-70/yr | Yearly (promo pricing first year) |
| Render Postgres | $7/mo OR migrate to Neon.tech free tier | **Within 30 days of DB creation** (free DB expires) |
| Render API always-on | $7/mo (optional) | Only if the ~30s cold-start on first visit becomes annoying |
| Razorpay | 2% per domestic transaction, ~3% international | Per transaction, no fixed fee |
| GitHub Pages | Free | — |

## Known placeholder/temporary items

- GoDaddy "Websites + Marketing Lite" ($20.88) was purchased but is unused — the site is hosted free on GitHub Pages. Refundable within 30 days.
- HTTP origins are allowed in the API CORS config only until the HTTPS certificate finishes provisioning; remove `http://` entries from `render.yaml` ALLOWED_ORIGINS after "Enforce HTTPS" is on.
- Sample reactions on the home page (see blockers).

## Operating runbook

- **Site down?** Check https://www.githubstatus.com (Pages) and Render dashboard.
- **Deploy failed?** GitHub repo → Actions tab → open the red run.
- **See orders**: Render dashboard → mamayya-db → Connect → run `SELECT order_id, created_at, name, phone, total FROM orders ORDER BY rowid_pk DESC;`
- **Change support contacts**: WhatsApp number + email live in `src/app/contact/page.tsx` and `src/components/track/TrackLookup.tsx`.
- **Local development**: `npm run dev -- -p 3001` for the site, `python -m uvicorn main:app --port 8001` inside `backend/` for the API (uses SQLite locally, no setup).
