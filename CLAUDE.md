# RisingOS

## What this app does
Public bilingual (JP/EN) landing page for Yumori Path (湯守道) — a coordination platform for respectful restoration of stigmatized properties in Japan. Public forms for property inquiries and clergy partner registration. Private admin CRM for Yumori Path operations at `/admin` — cases, clergy partners, real estate leads, outreach, and finance. No public access to admin routes.

## Stack
Express.js + EJS + PostgreSQL (Neon). Session-based admin auth. Admin routes served at `/admin`.

## Directory map
- `server.js` — entry point, wires middleware and route mounts
- `db/` — database access (one pool + named query functions per entity)
- `routes/` — Express routers (one per resource group)
- `services/` — matching logic
- `middleware/` — auth guard
- `views/` — EJS templates (public landing + admin views)
- `migrations/` — SQL migrations (timestamp-prefixed `.sql` files)
- `lib/` — shared utilities (landing context builder)

## Database
Tables: `cases` (property cases), `real_estate_leads`, `clergy_partners`, `restoration_vendors`, `outreach_log`, `tasks`, `payments`, `portfolio_pillars` (three-pillar definitions), `portfolio_entries` (per-pillar asset rows). All include `created_at`/`updated_at` timestamps. Pool lives in `db/index.js` only.

## External integrations
- **Stripe**: wired up for the property-search subscription product ($9/mo, $110/yr) via the `stripe` npm package — Checkout Sessions for signup, `/webhooks/stripe` (raw body, signature-verified) keeps `users.subscription_status` in sync. Needs `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL` env vars — see `.env`.
- **OpenAI**: available via `new OpenAI()` — not used in admin yet

## Recent changes
- **2026-08-31** — Added a paid consumer product on top of the existing B2B coordination business (kept as-is): customer accounts (`users` table, email+password via `db/users.js` + `lib/password.js`), Stripe subscription billing (`routes/billing.js`, `routes/customer-auth.js`), and a subscription-gated interactive map (`/map`, Leaflet + OpenStreetMap, pins from `GET /api/lookup/bbox`) for browsing the stigmatized-property database. Added `db/properties.js` and an admin CRUD screen (`/admin/properties`) to manage property rows (address/lat-lng/incident info), since the `properties` table previously had no way to populate data. Softened the consumer-facing copy (hero, homepage lookup widget, pricing, contact CTA, footer) toward a gentler, personal tone — "if it helps, visit a temple/shrine/clergy for prayer, or make a donation" — while leaving the B2B pages (`for-re.ejs`, `for-clergy.ejs`, `audience.ejs`) untouched. JP translations in the new copy are a first draft and should get a native-speaker review before relying on them.
- **2026-06-05** — Completed English translations — all public landing sections (process, services, audience, pricing, trust, contact CTA, footer), both inquiry forms (property + clergy), and legal pages (privacy policy, terms of service) now have full EN/JP support via `data-en`/`data-ja` attributes.
- **2026-06-04** — English language toggle in navbar — JP/EN switcher persists via localStorage. EN shows brand "Yumori Path" and tagline "Restoration. Respect. Renewal." Added to all public pages.
- **2026-06-04** — Add portfolio tracker — three-pillar overview panel (Digital Sovereignty, Generational Real Estate, Yumori Path) at `/admin/portfolio`. CRUD for entries per pillar.
- **2026-06-04** — Fixed Japanese brand name from broken "ユimori道" to correct "湯守道" (full kanji) across all views, meta tags, OG tags, and CLAUDE.md.
- **2026-06-03** — Japanese landing page (湯守道) with indigo/gold theme, Noto Sans JP. 10 sections including hero, process steps, pricing. Two functional forms: property submission and clergy partner registration, both storing to DB.
- **2026-06-03** — Added `routes/forms.js` for public `/property-form` and `/clergy-form` endpoints (GET + POST). Privacy/terms pages also served here.