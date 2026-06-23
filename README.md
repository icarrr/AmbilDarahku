# AmbilDarahku

Platform donor darah berbasis komunitas untuk Indonesia. Membangun jaringan donor darah untuk membantu menyelamatkan lebih banyak nyawa melalui platform yang cepat, transparan, dan terpercaya.

## Key Features

- **Donor Search** — Cari donor berdasarkan golongan darah, lokasi, dan ketersediaan
- **Blood Requests** — Buat dan bagikan permintaan darah darurat
- **Blood Request Discovery** — Scrape permintaan darah dari sumber eksternal (Kawan Sedarah), upsert tiap 1 jam
- **Donor Passport** — Paspor digital dengan QR code verifikasi
- **Donor History** — Catat dan pantau riwayat donor darah
- **Badges & Titles** — Penghargaan otomatis berdasarkan jumlah donor
- **Trust Score** — Sistem skor kepercayaan donor
- **Verification Levels** — Tingkat verifikasi (Self → Community → PMI)
- **Donation Claims** — Klaim donasi lama yang belum tercatat
- **Event Discovery** — Temukan event donor darah dari PMI websites + REST API eksternal
- **Leaderboard** — Papan peringkat nasional dan regional
- **Admin Dashboard** — Manajemen pengguna, klaim, verifikasi, analytics, scrape trigger

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
| Maps | OpenStreetMap (declared, not integrated) |
| Scrapers | Axios + Cheerio (event discovery), Axios + pg Pool (blood request discovery) |

## Project Structure

```
src/
├── app/
│   ├── api/v1/          ← 64 route files (auth, donor, requests, admin, events, blood-requests)
│   ├── (pages)          ← 31 page.tsx files (public + authenticated)
│   └── layout.tsx       ← Root layout (AuthProvider, Sidebar, BottomNav, Toaster)
├── components/
│   ├── ui/              ← shadcn/ui primitives (button, input, select, badge, etc.)
│   └── (custom)         ← GlassCard, ConfirmDialog, BottomNav, Navbar, etc.
└── lib/
    ├── db.ts            ← Lazy-init Supabase client Proxy
    ├── auth-middleware.ts ← JWT verification, role checks
    ├── jwt.ts           ← Token generation/verification
    ├── password.ts      ← bcrypt hashing
    ├── eligibility.ts   ← Donor eligibility rules
    ├── trust-score.ts   ← Trust score calculation
    ├── file.ts          ← Vercel Blob upload/delete
    ├── email.ts         ← SMTP email (verification, password reset)
    ├── api.ts           ← Client-side HTTP client with auto-refresh
    ├── auth-context.tsx  ← React Context for auth state
    ├── event-discovery/ ← Scrapers + runner for event discovery
    └── blood-request-discovery/ ← Runner for blood request discovery (new)
scripts/
├── migrate.ts           ← DDL migration (15 tables + RLS)
├── reset-db.ts          ← Drop all → migrate
├── seed-dev.ts          ← 8 dev donors
└── seed-production-like.ts ← Synthetic Indonesian data (SEED_SCALE)
```

## Setup & Run

```bash
# 1. Use correct Node version
source ~/.nvm/nvm.sh && nvm use 22

# 2. Install dependencies
npm ci

# 3. Configure environment
cp .env.example .env
# Edit .env — set Supabase URL/keys, JWT_SECRET, etc.

# 4. Run database migration
npm run migrate

# 5. Seed dev data (optional)
npm run seed

# 6. Start dev server
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

Supports Docker Compose (3 services: postgres, redis, frontend) and direct Vercel deployment.

## Important Notes

- All API routes use Supabase JS client (`supabase.from().select()`) — no raw SQL in API routes
- RLS enabled on all 15 tables; `service_role` bypasses RLS (no policies on anon key)
- Custom JWT auth (NOT Supabase Auth) — tokens stored in localStorage
- Private blob storage proxied through `/api/v1/files` — accepts both full blob URLs and path-only keys
- Blood donation rules: 450mL/bag, min weight 50kg, age 18–65, min interval 56 days
- UI language: Indonesian (`id-ID`), code: English
- `pg` is devDependency only for migration script and discovery runners
- `redis` in docker-compose is declared but not used in code
- Event images stored as `poster_url` (path-only blob key) — `banner_url` column dropped
- Blood request dedup via `(source_type, source_request_id)` unique index
- Vercel Cron: events discover every 3h, blood requests discover every 1h
