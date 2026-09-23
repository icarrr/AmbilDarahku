# AmbilDarahku

Platform donor darah berbasis komunitas untuk Indonesia. Membangun jaringan donor darah untuk membantu menyelamatkan lebih banyak nyawa melalui platform yang cepat, transparan, dan terpercaya.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5 · TailwindCSS 4 · Base UI · Supabase (PostgreSQL 16) · Vercel Blob · Custom JWT Auth

## Features

- **Donor Search** — Cari donor berdasarkan golongan darah, lokasi, dan ketersediaan dengan filter wilayah
- **Blood Requests** — Buat, bagikan, dan penuhi permintaan darah darurat dengan kartu share + QR
- **Blood Request Discovery** — Scrape permintaan darah dari sumber eksternal (Kawan Sedarah), upsert per interval scheduler (10 menit)
- **Event Discovery** — Temukan event donor darah dari PMI websites + REST API eksternal, unduh poster ke Vercel Blob
- **Profile Discovery** — Sinkronisasi profil donor dari sumber eksternal dengan pagination (>1000 rows)
- **Donor Passport** — Paspor digital dengan QR code verifikasi
- **Donor History** — Catat dan pantau riwayat donor darah
- **Badges & Titles** — Penghargaan otomatis berdasarkan jumlah donor
- **Trust Score** — Sistem skor kepercayaan donor
- **Verification Levels** — Tingkat verifikasi (Self → Community → PMI)
- **Donation Claims** — Klaim donasi lama yang belum tercatat
- **Leaderboard** — Papan peringkat nasional dan regional
- **Maintenance Mode** — Middleware-based maintenance gate dengan admin bypass
- **Partner Branding** — Halaman "Partner Kami" dengan logo Kawan Sedarah
- **Admin Dashboard** — Manajemen pengguna, klaim, verifikasi, analytics, scrape trigger, maintenance toggle

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.2.6, React 19.2.4, TypeScript 5 |
| Styling | TailwindCSS 4, Base UI (shadcn/ui), Glassmorphism |
| Database | PostgreSQL 16 (Supabase Cloud) via `@supabase/supabase-js` |
| Auth | Custom JWT (jsonwebtoken + bcryptjs), refresh token rotation |
| Storage | Vercel Blob (private, proxied through `/api/v1/files`) |
| File Upload | Multipart → `/api/v1/upload` → Vercel Blob `put()` |
| Email | Nodemailer via SMTP (Brevo) |
| QR | `api.qrserver.com` (external) |
| Scrapers | Axios + Supabase REST API (event/blood-request/profile discovery) |

## Project Structure

```
src/
├── app/
│   ├── api/v1/          ← 74 route files (auth, donor, requests, admin, events, discover)
│   ├── (pages)          ← 33 page.tsx files (public + authenticated)
│   └── layout.tsx       ← Root layout (AuthProvider, Sidebar, BottomNav, Toaster)
├── components/
│   ├── ui/              ← shadcn/ui primitives (button, input, select, badge, etc.)
│   └── (custom)         ← GlassCard, ConfirmDialog, BottomNav (hamburger drawer), etc.
├── lib/
│   ├── db.ts            ← Lazy-init Supabase client Proxy
│   ├── pg.ts            ← Singleton raw-Postgres pool (admin analytics SQL aggregation)
│   ├── auth-middleware.ts ← JWT verification, role checks
│   ├── jwt.ts           ← Token generation/verification
│   ├── password.ts      ← bcrypt hashing
│   ├── eligibility.ts   ← Donor eligibility rules
│   ├── trust-score.ts   ← Trust score calculation
│   ├── file.ts          ← Vercel Blob upload/delete, signBlobUrl (server-only)
│   ├── file-url.ts      ← getFileUrl() proxy helper (client-safe, no server deps)
│   ├── email.ts         ← SMTP email (verification, password reset)
│   ├── api.ts           ← Client-side HTTP client with auto-refresh
│   ├── auth-context.tsx  ← React Context for auth state
│   ├── config.ts        ← Config table (maintenance mode)
│   ├── data/wilayah.ts  ← Server-side wilayah lookup + search
│   ├── hooks/useWilayah.ts ← Client-side cascading dropdown hook (lazy per-level)
│   ├── event-discovery/ ← Scrapers + runner for event discovery (7 sources)
│   ├── blood-request-discovery/ ← Runner for blood request discovery
│   └── profile-discovery/ ← Runner for profile discovery
├── middleware.ts         ← Edge middleware (maintenance mode gate)
scripts/
├── split-wilayah.ts   ← Regenerates wilayah JSON from raw source + writes old→new code map
├── migrate.ts         ← DDL migration (14 tables + indexes + admin + badges + scheduler)
├── migrate-wilayah-codes.ts ← Remaps users.province/city/district old → new codes
├── reset-db.ts        ← Drop all → migrate
├── seed-dev.ts        ← Dev donors
├── seed-production-like.ts ← Synthetic Indonesian data (SEED_SCALE)
├── seed-wilayah.ts    ← Reseed wilayah_regions table (7.6k rows)
├── seed-profiles.ts   ← Seed donor profiles from Kawan Sedarah
├── discover-events.ts ← Manual event discovery trigger
└── test-(privacy|scrape-lock).ts ← Smoke checks
```

## Setup & Run

```bash
# 1. Use correct Node version
nvm use 22

# 2. Install dependencies
npm ci

# 3. Configure environment
cp .env.example .env
# Edit .env — set Supabase URL/keys, JWT_SECRET, etc.

# 4. Regenerate wilayah data (new valid source; writes lazy split files + old→new code map)
npm run split-wilayah

# 5. Run database migration (schema + indexes + admin seed + scheduler job)
npm run migrate

# 6. Remap existing users' old wilayah codes (only if users hold legacy numeric codes)
npm run migrate:wilayah

# 7. Seed wilayah regions table (optional refresh)
npm run seed-wilayah

# 8. Seed dev data (optional)
npm run seed

# 9. Start dev server
npm run dev
```

Admin credentials: set `SEED_ADMIN_EMAIL` (super admin auto-created by migration; password defaults to `admin123`, override via `SEED_ADMIN_PASSWORD`).
Dev donor password: `donor123`

## Deployment

```bash
# Build for production
npm run build

# Start standalone server
npm start
```

CI runs on push/PR to `main` (GitHub Actions — `npm ci` + `npm run build`).

Supports direct Vercel deployment (Hobby plan) and Docker Compose (postgres + redis + frontend).

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Service role key (bypasses RLS) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Anon/public key |
| `JWT_SECRET` | Yes | HMAC signing key |
| `BLOB_READ_WRITE_TOKEN` | Yes | Vercel Blob token |
| `CRON_SECRET` | For scheduler | Bearer token required by pg_cron→pg_net scheduled trigger |
| `SMTP_HOST` | For email | SMTP server (empty = skip emails) |
| `SMTP_PORT` | No | Default: 587 |
| `SMTP_USER` | For email | SMTP username |
| `SMTP_PASSWORD` | For email | SMTP password |
| `SMTP_FROM` | No | Default: noreply@ambildarahku.id |
| `SEED_ADMIN_EMAIL` | For seed | Super admin email (created by migration) |
| `SEED_ADMIN_PASSWORD` | For seed | Super admin password (default: `admin123`) |
| `JWT_ACCESS_EXPIRY` | No | Default: 15m |
| `JWT_REFRESH_EXPIRY` | No | Default: 7d |
| `DATABASE_URL` | For migration + admin analytics | Direct PostgreSQL connection string (also used at runtime by admin analytics SQL aggregation) |
| `SCRAPE_TARGET_URL` | For scheduler | Deployed discover endpoint (e.g. `https://ambildarahku.vercel.app/api/v1/discover`) |
| `SCRAPE_INTERVAL_MINUTES` | No | pg_cron scrape interval (default: 60; currently 10) |
| `VERCEL_CRON_EXPR` | No | x-vercel-cron expression trusted by discover route (default: `0 * * * *`) |
| `NEXT_PUBLIC_COORDINATOR_PHONE` | For contact buttons | Coordinator WhatsApp (E.164) — all "Hubungi" buttons; empty = hidden |
| `NEXT_PUBLIC_APP_URL` | No | Public-facing URL |

## Important Notes

- All API routes use Supabase JS client (`supabase.from().select()`) — except admin analytics endpoints, which use raw SQL aggregation via `pg` (`getPool()`, requires `DATABASE_URL` at runtime)
- RLS enabled on all tables; `service_role` bypasses RLS (no policies on anon key)
- Custom JWT auth (NOT Supabase Auth) — tokens stored in localStorage
- Private blob storage proxied through `/api/v1/files` — accepts both full blob URLs and path-only keys; external domains (Google, etc.) pass through directly
- Blood donation rules: 0.45L/bag, min weight 50kg, age 18–65, min interval 56 days
- `date_of_birth` nullable for seeded users; self-registration still requires it
- Phone normalization: `08xx` → `628xx`, strips dashes/spaces
- City/province/district stored as wilayah codes (numeric IDs), resolved via `lookupName()` / `searchWilayah()`
- UI language: Indonesian (`id-ID`), code: English
- `pg` is devDependency (migration + admin analytics)
- Blood request dedup via `(source_type, source_request_id)` unique index
- Wilayah data generated from `yusufsyaifudin/wilayah-indonesia` (pinned commit) via `scripts/split-wilayah.ts` — old source was invalid and has been replaced. Client fetches lazily per level (`provinces.json`, `regencies/{id}.json`, `districts/{id}.json`); `migrate-wilayah-codes` remaps legacy user codes
- Automatic scraping: Supabase native scheduler (pg_cron + pg_net) POSTs to `/api/v1/discover` every `SCRAPE_INTERVAL_MINUTES` (currently 10m). Requires `SCRAPE_TARGET_URL` + `CRON_SECRET` — **`CRON_SECRET` must also be set in Vercel runtime env**, otherwise pg_net posts are rejected silently. Vercel Cron (`vercel.json`) fires once-daily `0 18 * * *` (01:00 WIB) as a failsafe — Hobby plan caps cron at once/day, so the 10-minute cadence runs on pg_cron only. `discover` trusts `x-scheduled`+`CRON_SECRET` or `x-vercel-cron`. Locks + run history live in `scrape_jobs`/`scrape_runs`; the admin scrape page exposes both run history and pg_cron diagnostics (`pgCronRuns`)
- Maintenance mode: Edge middleware with allowlist for admin/auth/login paths
- Partner: Kawan Sedarah (logo on homepage "Partner Kami" section, links to Instagram)
