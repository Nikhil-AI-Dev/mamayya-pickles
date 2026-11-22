# Mamayya Pickles

Online store for handmade non-veg pickles (chicken, mutton, fish, prawn),
prepared fresh per order and delivered across India. Prepaid only, guest
checkout, no accounts.

- **Storefront**: static Next.js site, deployed to GitHub Pages at
  [mamayyapickles.com](https://mamayyapickles.com) on every push to `master`.
- **Order API**: single-file FastAPI service (`backend/main.py`) on Render, with
  a Postgres database. It owns all pricing, creates order numbers, verifies
  Razorpay payments, sends emails through Resend, and serves order tracking.

Operations, accounts, and launch notes live in [HANDOFF.md](./HANDOFF.md).

## Local development

Storefront (port 3001):

```bash
npm install
npm run dev -- -p 3001
```

Order API (port 8001, SQLite, no setup):

```bash
cd backend
pip install -r requirements.txt
REQUIRE_PAYMENTS=false python -m uvicorn main:app --port 8001
```

Point the site at the local API by setting `NEXT_PUBLIC_API_URL=http://localhost:8001`.

## Checks

```bash
npm run lint          # ESLint
npx tsc --noEmit      # type check
npm run build         # production static export

cd backend
pip install -r requirements.txt -r requirements-dev.txt
python -m pytest tests          # API tests (SQLite, no network)
```

CI runs the API tests and the lint/build on every push; a red test blocks the
site deploy.

## Prices live in two places and must match

`src/lib/products.ts` (what shoppers see) and `backend/main.py`
`PRODUCT_PRICES` / `BOX_PRICES` (what orders actually charge). The backend is
the authority; the storefront values are display only.
