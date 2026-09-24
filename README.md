# AmbilDarahku

A community-based blood donor platform for Indonesia. It helps donors find urgent blood requests nearby and helps patients' families find compatible, available donors.

## Overview

AmbilDarahku is a web application that connects blood donors with patients or parties in need of blood. Donors can manage their availability status, record donation history, build reputation (verification levels, trust score, badges), and receive recognition for their contributions. Administrators can manage users, requests, donation claims, verifications, awards, and monitor data through an analytics dashboard.

The main workflow is:

1. A donor registers and completes their profile (blood type, domicile, weight).
2. A patient/family creates an urgent blood request and shares a request card (QR + compatibility matrix).
3. Compatible, available donors contact the coordinator or mark the request as fulfilled.
4. Donations are recorded in the donor's history; verification and awards strengthen donor credibility.
5. Blood requests and donation event data are synchronized automatically from external sources.

## Features

- **Donor Search** — Search for donors by blood type, location, and availability, with region filters and geolocation
- **Blood Requests** — Create, share, and fulfill urgent blood requests; share card with QR + compatibility matrix; WhatsApp "Contact" button for the coordinator
- **Blood Request Discovery** — Synchronization of blood requests from an external source (Kawan Sedarah)
- **Event Discovery** — Donation events from PMI websites and REST APIs; event archive
- **Profile Discovery** — Donor profile synchronization from an external source
- **Donor History** — Donation log with proof upload
- **Donation Claims** — Claim old unrecorded donations, with admin review
- **Verification Levels** — Donor verification tiers (Self → Community → Verified), with submission and admin review
- **Trust Score** — Donor trust score computed from activity
- **Leaderboard** — National and regional donor rankings
- **Timeline** — Unified activity feed (history, verification, claims, requests, events)
- **Donor Passport** — Digital passport with QR code; public verification page
- **Recognition & Awards** — Donor portfolio and award/title configuration (admin); `/recognition/*` redirects to `/passport`
- **Admin Dashboard** — Statistics, user management, claim/verification review, request & report management, analytics (institutions, cities, years, months, age, top donors), award configuration, manual scrape trigger, maintenance mode
- **Maintenance Mode** — Edge-middleware gate with allowlist for admin/auth pages
- **Partner Branding** — "Partner Kami" (Kawan Sedarah) page

The application UI is in Indonesian (`id-ID`); the codebase is in English.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.2.6 (App Router), React 19.2.4, TypeScript 5 |
| Styling | TailwindCSS 4, Base UI (`@base-ui/react`), glassmorphism ("Vitality Flow") |
| Database | PostgreSQL 16 (Supabase) via `@supabase/supabase-js` (REST) |
| Analytics | SQL aggregation via `pg` (raw Postgres pool, server-side) |
| Auth | Custom JWT (jsonwebtoken + bcryptjs), 15m access + 7d refresh rotation |
| Storage | Vercel Blob (private, proxied through `/api/v1/files`) |
| Upload | Multipart → `/api/v1/upload` → Vercel Blob `put()` |
| Email | Nodemailer via SMTP (optional; empty = email skipped) |
| QR | `api.qrserver.com` (external) |
| Scrapers | Axios + Cheerio (event / blood-request / profile discovery) |
| Container | Docker + Docker Compose (postgres + redis + frontend) |
| Scheduler | Supabase `pg_cron` + `pg_net` (automatic discovery) + Vercel Cron (daily failsafe) |
| CI | GitHub Actions (`npm ci` + `npm run build`) |

> **Note:** Redis is available in Docker Compose but is not used by the application code.

## Requirements

- Node.js ≥ 22 (recommended via `nvm`; see `.nvmrc`)
- npm (bundled with Node)
- Supabase account (project URL + anon key + service key)
- Vercel Blob token (for proof/photo upload)
- Docker + Docker Compose (optional, for local Postgres and containerization)
- SMTP server (optional, for email verification and password reset)

## Getting Started

### Installation

```bash
nvm use 22          # or: source "$HOME/.nvm/nvm.sh" && nvm use
npm ci
```

### Configuration

```bash
cp .env.example .env
```

Fill in the values in `.env` according to the Environment Variables table below. For local development with Docker:

```bash
docker compose up -d postgres redis
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Anon/public key (safe for the client) |
| `SUPABASE_SERVICE_KEY` | Yes | Service role key — **server only** |
| `JWT_SECRET` | Yes | HMAC JWT secret — **server only**; change for production |
| `DATABASE_URL` | Migrations & analytics | Direct PostgreSQL connection string (migrations + admin analytics aggregation) |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` / `DB_SSLMODE` | Local Docker | Local Postgres credentials (`DB_HOST=postgres` in Compose, `localhost` outside Docker) |
| `BLOB_READ_WRITE_TOKEN` | Uploads | Vercel Blob token — **server only** |
| `SMTP_HOST` | Email | SMTP host; empty = email disabled |
| `SMTP_PORT` | No | Default `587` |
| `SMTP_USER` / `SMTP_PASSWORD` | Email | SMTP credentials |
| `SMTP_FROM` | No | Default `noreply@ambildarahku.id` |
| `SEED_ADMIN_EMAIL` | Admin seed | Super admin auto-created at migration; default password `admin123` (override with `SEED_ADMIN_PASSWORD`) |
| `SEED_ADMIN_PASSWORD` | No | Super admin password |
| `SEED_ADMIN_PHONE` | No | Super admin phone |
| `NEXT_PUBLIC_COORDINATOR_PHONE` | Contact | Coordinator number (E.164) for all "Hubungi" buttons; empty = buttons hidden |
| `APP_URL` | No | Base URL for email verification links (default `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | No | Public frontend URL |
| `NEXT_PUBLIC_API_URL` | No | API base path (default `/api/v1`) |
| `DOMAIN` | SEO | Domain for sitemap |
| `FRONTEND_PORT` | No | Frontend port (default `3000`) |
| `CRON_SECRET` | Scheduler | Bearer token for scheduled discovery triggers — **must also be set in the Vercel runtime env** |
| `SCRAPE_TARGET_URL` | Scheduler | Deployed endpoint, e.g. `https://…/api/v1/discover` |
| `SCRAPE_INTERVAL_MINUTES` | No | pg_cron interval (default `60`); reapply with `npm run migrate` |
| `VERCEL_CRON_EXPR` | No | Vercel cron expression trusted by `/api/v1/discover` (default `0 18 * * *`) |
| `KS_ANON_KEY` | Discovery | Kawan Sedarah Supabase anon key (external data source) |

> **Security:** `SUPABASE_SERVICE_KEY`, `BLOB_READ_WRITE_TOKEN`, and `JWT_SECRET` must be used only on the server (API routes). Never expose them to the browser. Only variables with the `NEXT_PUBLIC_` prefix are safe for the client.

### Running Locally

```bash
# Prepare the schema (20 tables + indexes + admin seed + scheduler job)
npm run migrate

# Optional: developer data
npm run seed

# Start the dev server
npm run dev
```

Open `http://localhost:3000`. Seed donor accounts use the password `donor123`; a super admin is created automatically when `SEED_ADMIN_EMAIL` is set (default password `admin123`).

## Project Structure

```
ambildarahku/
├── src/
│   ├── app/
│   │   ├── page.tsx               # Landing page (live stats, partner)
│   │   ├── login/ register/       # Auth (3-step registration: profile → blood → domicile)
│   │   ├── forgot-password/ reset-password/ verify-email/
│   │   ├── profile/               # Donor dashboard (stats, verification, trust, timeline)
│   │   ├── search/                # Donor search
│   │   ├── requests/ requests/new/ requests/share/[id]/
│   │   ├── donor-history/         # Donation log + proof upload
│   │   ├── claims/ claims/new/    # Donation claims
│   │   ├── verification/          # Verification levels + submission
│   │   ├── leaderboard/ timeline/
│   │   ├── events/ events/new/ events/archive/
│   │   ├── passport/ passport/verify/[token]/   # + public QR verification (SSR)
│   │   ├── u/[username]/          # Public portfolio (SSR)
│   │   ├── admin/ admin/analytics/ admin/awards/ admin/blood-requests/
│   │   │   └── admin/claims/ admin/reports/ admin/verifications/
│   │   ├── privacy/ terms/ maintenance/
│   │   ├── robots.txt/ sitemap.xml/
│   │   └── api/v1/                # 73 route files (22 groups: auth, donors, requests,
│   │                              #   blood-requests, events, discover, admin, files, etc.)
│   ├── components/                # 14 custom components (GlassCard, Sidebar, etc.) + 9 UI primitives
│   ├── lib/                       # db.ts (Supabase lazy-init Proxy), pg.ts, auth-middleware.ts,
│   │                              #   jwt.ts, password.ts, email.ts, file.ts (Blob), eligibility.ts,
│   │                              #   trust-score.ts, blood-compatibility.ts, config.ts, api.ts,
│   │                              #   auth-context.tsx, data/wilayah.ts, hooks/,
│   │                              #   event-discovery/, blood-request-discovery/, profile-discovery/
│   ├── middleware.ts              # Edge middleware — maintenance gate
│   └── utils/
├── scripts/
│   ├── migrate.ts                 # Idempotent DDL (20 tables + indexes + admin seed + scheduler job)
│   ├── reset-db.ts                # Drop all → re-migrate
│   ├── seed-dev.ts                # Developer donor data
│   ├── seed-production-like.ts    # Large-scale synthetic data (SEED_SCALE)
│   ├── seed-wilayah.ts            # Reseed wilayah_regions table
│   ├── seed-profiles.ts           # Seed donor profiles from Kawan Sedarah
│   ├── split-wilayah.ts           # Regenerate region data + legacy code mapping
│   ├── migrate-wilayah-codes.ts   # Remap legacy user region codes
│   ├── discover-events.ts         # Manual event discovery trigger
│   └── test-privacy.ts test-scrape-lock.ts   # Smoke checks
├── public/
├── docker-compose.yml             # postgres + redis + frontend
├── Dockerfile                     # Multi-stage, node:22-alpine, standalone
├── next.config.ts                 # output: standalone; redirect /recognition → /passport
├── vercel.json                    # Daily cron for /api/v1/discover
├── .github/workflows/ci.yml       # CI: npm ci + npm run build
├── .env.example
├── PRD.md  DESIGN.md
└── package.json
```

## Usage

### Public Users (no login)

- Search for donors by blood type and location
- View open blood requests and share cards
- View blood donation events
- Verify a donor passport QR (`/passport/verify/[token]`)
- View public donor portfolios (`/u/[username]`), privacy policy, and terms

### Donors (logged in)

- 3-step registration with email verification
- Manage availability status and eligibility
- Record donation history and upload proof
- Submit donation claims and request higher verification levels
- Create/fulfill blood requests, view timeline, leaderboard, digital passport, and awards portfolio

### Administrators (`super_admin`)

- Statistics dashboard & analytics (institutions, cities, years, months, age, top donors)
- User & role management
- Donation claim & verification review
- Blood request & report management
- Award/title configuration
- Manual scrape trigger and scheduler job history
- Maintenance mode toggle

## API / Integrations

- **Base path:** `/api/v1` (Next.js Route Handlers `route.ts`)
- **Auth:** Bearer JWT access token (15 minutes) + refresh token rotation (7 days); `src/lib/api.ts` performs auto-refresh
- **Role gates:** `authRequired`, `adminRequired`, `emailVerifiedRequired` in `src/lib/auth-middleware.ts`

Main endpoint groups: `auth` (register, login, refresh, logout, verify/resend email, forgot/reset/change password), `donors` (profile, status, search), `requests` & `blood-requests` (requests, fulfill), `donor-history`, `claims`, `donor-verification`, `trust-score`, `leaderboard`, `timeline`, `passport`, `recognition`, `events`, `stats`, `reports`, `admin/*` (statistics, analytics, users, claims, verifications, awards, maintenance, scrape), `files` (private blob proxy), `upload`, `discover` (scheduler), `health`.

### External Integrations

- **Supabase** — primary data store via `@supabase/supabase-js` (REST); `pg` pool used only for migrations & analytics aggregation
- **Vercel Blob** — private file storage; accessed via the `/api/v1/files` proxy (accepts full URLs or path-only)
- **SMTP (Nodemailer)** — email verification & password reset
- **Kawan Sedarah** — data source for synchronization (blood requests + donor profiles)
- **PMI websites + REST API** — blood donation event data source
- **QR Code** — `api.qrserver.com` (external)

## Automated Synchronization (Discovery/Scraping)

- **Synchronized data:** donation events (PMI websites/REST), blood requests (Kawan Sedarah), donor profiles (Kawan Sedarah)
- **How it works:** runners in `src/lib/event-discovery/`, `src/lib/blood-request-discovery/`, and `src/lib/profile-discovery/`; orchestration in `src/lib/discovery/`
- **Scheduler:** Supabase `pg_cron` + `pg_net` `POST` to `/api/v1/discover` using `SCRAPE_TARGET_URL` at `SCRAPE_INTERVAL_MINUTES` (job scheduled during `npm run migrate`). Requires `CRON_SECRET` — **also required in the deployment runtime env**, otherwise pg_net posts are silently rejected
- **Failsafe:** Vercel Cron (`vercel.json`) fires once daily (`0 18 * * *` / 01:00 WIB)
- **Manual:** via the admin scrape page ("Scrape Now"); `npm run discover` for events
- **Trigger security:** `/api/v1/discover` trusts only `x-scheduled` + `CRON_SECRET` or `x-vercel-cron`
- **Monitoring:** lock & execution history recorded in `scrape_jobs` / `scrape_runs`; the admin page shows run history and `pg_cron_runs` diagnostics
- **Fallback:** local Postgres without `pg_cron`/`pg_net` supports manual triggers only (warning printed at migration)

## Database

- **DBMS:** PostgreSQL 16 (Supabase Cloud for deployment; Docker `postgres:16-alpine` locally)
- **Access in the app:** all API routes use the Supabase JS client (`supabase.from().select()`); admin analytics endpoints use raw SQL aggregation via `pg` (requires `DATABASE_URL` at runtime)
- **Migrations:** idempotent DDL in `scripts/migrate.ts` — 20 tables (`users`, `donor_histories`, `blood_requests`, `request_fulfillments`, `donation_claims`, `donor_verifications`, `badges`, `user_badges`, `award_configs`, `user_titles`, `donor_passports`, `refresh_tokens`, `verification_tokens`, `events`, `event_sources`, `wilayah_regions`, `config`, `scrape_jobs`, `scrape_runs`, `reports`) + indexes + admin seed + scheduler job
- **Setup:** `npm run migrate` (local requires running Postgres; see `docker compose up -d postgres`)
- **Seeds:** `npm run seed` (dev), `npm run seed:prod-like`, `npm run seed-wilayah`, `npm run seed-profiles`
- **Region data:** `wilayah_regions` table + lazy-loaded JSON files per level (province/regency/district); region codes stored as numeric IDs, remapped via `npm run migrate:wilayah`

## Development

```bash
# Dev server (hot reload)
npm run dev

# Lint
npm run lint

# Production build
npm run build

# Run production build
npm start
```

| Script | Purpose |
|---|---|
| `npm run migrate` | Schema migration + admin seed + scheduler job |
| `npm run reset` | Drop all data → re-migrate (destructive) |
| `npm run seed` | Seed developer data |
| `npm run seed:prod-like` | Seed large-scale synthetic data |
| `npm run seed-wilayah` | Reseed region table |
| `npm run seed-profiles` | Seed donor profiles from Kawan Sedarah |
| `npm run split-wilayah` | Regenerate region data + legacy code mapping |
| `npm run migrate:wilayah` | Remap legacy user region codes |
| `npm run discover` | Manual event discovery trigger |
| `npm run test:privacy` | Privacy smoke check (public data) |
| `npm run test:scrape-lock` | Scheduler lock smoke check |

## Deployment

### Vercel (Hobby plan)

1. Build: `npm run build` (GitHub Actions CI runs `npm ci` + `npm run build` on every push/PR to `main`)
2. Set all environment variables in the Vercel dashboard (see table above), including `SUPABASE_*`, `JWT_SECRET`, `BLOB_READ_WRITE_TOKEN`, and **`CRON_SECRET` in the runtime env** for the scheduler
3. Discovery scheduler: set `SCRAPE_TARGET_URL` to the deployed URL (`https://…/api/v1/discover`); Vercel Cron (`vercel.json`) provides the daily failsafe
4. Verify: `/api/v1/health`, admin login, admin scrape page for job status

### Docker Compose

```bash
docker compose up --build
```

Services: `postgres` (16-alpine, persisted volume), `redis` (7-alpine), `frontend` (multi-stage Dockerfile, `node:22-alpine`, standalone output). Env is read from `.env` / `.env.local`; see `docker-compose.yml`.

> Without Supabase locally: migrations use `DB_*` vars, but the runtime still needs Supabase URL/keys for API routes.

## Responsive Design

The application supports mobile, tablet, and desktop layouts — desktop sidebar navigation and mobile bottom-nav/drawer.

## Security & Privacy

- **JWT:** 15-minute access token + 7-day rotating refresh token; refresh tokens are invalidated on every use; passwords hashed with bcrypt
- **Secrets:** `SUPABASE_SERVICE_KEY`, `BLOB_READ_WRITE_TOKEN`, and `JWT_SECRET` are strictly server-side (not `NEXT_PUBLIC_`)
- **Files:** blobs are private, accessed only through the authenticated `/api/v1/files` proxy
- **Public pages (SSR)** expose only public fields; protected endpoints require `super_admin` / auth roles
- **Discovery endpoint** cannot be triggered publicly — only `CRON_SECRET` / `x-vercel-cron`
- **Known gaps:** CORS allows all origins (`*`), phone numbers are exposed in the donor search API, no rate limiting (except forgot-password 1 req/min), no audit logging, no automated tests
- **Donation rules:** 0.35 L/bag for ≤55 kg and 0.45 L/bag for >55 kg; minimum 56-day interval; age range 18–65

## Troubleshooting

### Login/registration fails (500)
Check `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_KEY` in `.env`.

### `npm run migrate` fails
- Ensure Postgres is running: `docker compose up -d postgres`
- Ensure `DATABASE_URL` (Supabase) or `DB_*` vars (local) are correct; the `uuid-ossp` extension must be available
- Reset: `npm run reset` (destructive)

### Proof upload fails / blob error
Set `BLOB_READ_WRITE_TOKEN` in the Vercel Blob store.

### Discovery scheduler not running
1. Set `SCRAPE_TARGET_URL` + `CRON_SECRET`, then re-run `npm run migrate` to reschedule the job
2. Ensure `CRON_SECRET` is also set in the deployment runtime env (Vercel) — otherwise pg_net posts are silently rejected
3. Check run history and `pg_cron_runs` in the admin scrape page

### "invalid or expired token"
Access tokens last 15 minutes; the client should auto-refresh. Check system clock synchronization (JWT uses timestamps).

### "email/phone already registered"
Unique constraints on the `users` table (`email`, `phone`). Use a different email/phone or remove old data.

### Legacy region data mismatch
Legacy (numeric) region codes can be remapped with `npm run migrate:wilayah` after `npm run split-wilayah`.

## Contributing

1. Fork the repository and create a feature branch (`feat/…`, `fix/…`)
2. Run verification before opening a PR: `npm run lint`, `npm run build`, and smoke checks (`npm run test:privacy`, `npm run test:scrape-lock`)
3. Open a pull request to `main` (CI runs the build automatically)
4. For schema changes: update `scripts/migrate.ts` (idempotent DDL)

## License

MIT — see [LICENSE](LICENSE).