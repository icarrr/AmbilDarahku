# AmbilDarahku

Platform donor darah berbasis komunitas untuk Indonesia. Membangun jaringan donor darah untuk membantu menyelamatkan lebih banyak nyawa melalui platform yang cepat, transparan, dan terpercaya.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5 · TailwindCSS 4 · Base UI · Supabase (PostgreSQL 16) · Vercel Blob · Custom JWT Auth

## Features

- **Donor Search** — Cari donor berdasarkan golongan darah, lokasi, dan ketersediaan dengan filter wilayah
- **Blood Requests** — Buat, bagikan, dan penuhi permintaan darah darurat dengan kartu share + QR
- **Blood Request Discovery** — Scrape permintaan darah dari sumber eksternal (Kawan Sedarah), upsert tiap 1 jam
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
│   ├── api/v1/          ← 64+ route files (auth, donor, requests, admin, events, discover)
│   ├── (pages)          ← 31 page.tsx files (public + authenticated)
│   └── layout.tsx       ← Root layout (AuthProvider, Sidebar, BottomNav, Toaster)
├── components/
│   ├── ui/              ← shadcn/ui primitives (button, input, select, badge, etc.)
│   └── (custom)         ← GlassCard, ConfirmDialog, BottomNav (hamburger drawer), etc.
├── lib/
│   ├── db.ts            ← Lazy-init Supabase client Proxy
│   ├── auth-middleware.ts ← JWT verification, role checks
│   ├── jwt.ts           ← Token generation/verification
│   ├── password.ts      ← bcrypt hashing
│   ├── eligibility.ts   ← Donor eligibility rules
│   ├── trust-score.ts   ← Trust score calculation
│   ├── file.ts          ← Vercel Blob upload/delete, getFileUrl() proxy helper
│   ├── email.ts         ← SMTP email (verification, password reset)
│   ├── api.ts           ← Client-side HTTP client with auto-refresh
│   ├── auth-context.tsx  ← React Context for auth state
│   ├── config.ts        ← Config table (maintenance mode)
│   ├── data/wilayah.ts  ← Server-side wilayah lookup + search
│   ├── hooks/useWilayah.ts ← Client-side cascading dropdown hook
│   ├── event-discovery/ ← Scrapers + runner for event discovery (7 sources)
│   ├── blood-request-discovery/ ← Runner for blood request discovery
│   └── profile-discovery/ ← Runner for profile discovery
├── middleware.ts         ← Edge middleware (maintenance mode gate)
scripts/
├── migrate.ts           ← DDL migration (17 tables + admin + badges + config)
├── reset-db.ts          ← Drop all → migrate
├── seed-dev.ts          ← 8 dev donors
├── seed-production-like.ts ← Synthetic Indonesian data (SEED_SCALE)
├── seed-wilayah.ts      ← 17k Indonesian wilayah regions
├── seed-profiles.ts     ← Seed donor profiles from Kawan Sedarah
└── discover-events.ts   ← Manual event discovery trigger
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

# 4. Run database migration
npm run migrate

# 5. Seed wilayah regions
npm run seed-wilayah

# 6. Seed dev data (optional)
npm run seed

# 7. Start dev server
npm run dev
```

Admin credentials: `admin@ambildarahku.id` / `admin123`
Dev donor password: `donor123`

## Deployment

```bash
# Build for production
npm run build

# Start standalone server
npm start
```

CI runs on push/PR to `main` (GitHub Actions — `npm ci` + `npm run build`).

Supports direct Vercel deployment (Hobby plan) and Docker Compose (postgres + frontend).

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Service role key (bypasses RLS) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Anon/public key |
| `JWT_SECRET` | Yes | HMAC signing key |
| `BLOB_READ_WRITE_TOKEN` | Yes | Vercel Blob token |
| `CRON_SECRET` | For cron | Bearer token for Vercel Cron jobs |
| `SMTP_HOST` | For email | SMTP server (empty = skip emails) |
| `SMTP_PORT` | No | Default: 587 |
| `SMTP_USER` | For email | SMTP username |
| `SMTP_PASSWORD` | For email | SMTP password |
| `SMTP_FROM` | No | Default: noreply@ambildarahku.id |
| `SEED_ADMIN_EMAIL` | For seed | Super admin email (created by migration) |
| `SEED_ADMIN_PASSWORD` | For seed | Super admin password |
| `JWT_ACCESS_EXPIRY` | No | Default: 15m |
| `JWT_REFRESH_EXPIRY` | No | Default: 7d |
| `DATABASE_URL` | For migration | Direct PostgreSQL connection string |
| `NEXT_PUBLIC_APP_URL` | No | Public-facing URL |

## Important Notes

- All API routes use Supabase JS client (`supabase.from().select()`) — no raw SQL in API routes
- RLS enabled on all tables; `service_role` bypasses RLS (no policies on anon key)
- Custom JWT auth (NOT Supabase Auth) — tokens stored in localStorage
- Private blob storage proxied through `/api/v1/files` — accepts both full blob URLs and path-only keys; external domains (Google, etc.) pass through directly
- Blood donation rules: 0.45L/bag, min weight 50kg, age 18–65, min interval 56 days
- `date_of_birth` nullable for seeded users; self-registration still requires it
- Phone normalization: `08xx` → `628xx`, strips dashes/spaces
- City/province/district stored as wilayah codes (numeric IDs), resolved via `lookupName()` / `searchWilayah()`
- UI language: Indonesian (`id-ID`), code: English
- `pg` is devDependency only for migration script
- Blood request dedup via `(source_type, source_request_id)` unique index
- Vercel Hobby cron: `/api/v1/discover` runs `0 * * * *` (events + blood requests + profiles combined)
- Maintenance mode: Edge middleware with allowlist for admin/auth/login paths
- Partner: Kawan Sedarah (logo on homepage "Partner Kami" section, links to Instagram)
