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
- **Stripe** (placeholder): payment links via `stripe` MCP — not connected to this app yet
- **OpenAI**: available via `new OpenAI()` — not used in admin yet

## Recent changes
- **2026-06-05** — Completed English translations — all public landing sections (process, services, audience, pricing, trust, contact CTA, footer), both inquiry forms (property + clergy), and legal pages (privacy policy, terms of service) now have full EN/JP support via `data-en`/`data-ja` attributes.
- **2026-06-04** — English language toggle in navbar — JP/EN switcher persists via localStorage. EN shows brand "Yumori Path" and tagline "Restoration. Respect. Renewal." Added to all public pages.
- **2026-06-04** — Add portfolio tracker — three-pillar overview panel (Digital Sovereignty, Generational Real Estate, Yumori Path) at `/admin/portfolio`. CRUD for entries per pillar.
- **2026-06-04** — Fixed Japanese brand name from broken "ユimori道" to correct "湯守道" (full kanji) across all views, meta tags, OG tags, and CLAUDE.md.
- **2026-06-03** — Japanese landing page (ユモリ道) with indigo/gold theme, Noto Sans JP. 10 sections including hero, process steps, pricing. Two functional forms: property submission and clergy partner registration, both storing to DB.
- **2026-06-03** — Added `routes/forms.js` for public `/property-form` and `/clergy-form` endpoints (GET + POST). Privacy/terms pages also served here.