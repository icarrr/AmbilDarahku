# AmbilDarahku

Platform donor darah berbasis komunitas untuk Indonesia. Membantu pendonor menemukan permintaan darah darurat di sekitarnya dan membantu keluarga pasien menemukan pendonor yang cocok dan tersedia.

## Overview

AmbilDarahku adalah aplikasi web yang menghubungkan pendonor darah dengan pasien/pihak yang membutuhkan darah. Donor dapat mengelola status ketersediaan, mencatat riwayat donasi, membangun reputasi (verifikasi, trust score, badge), dan mendapatkan pengakuan atas kontribusinya. Admin dapat mengelola pengguna, permintaan, klaim donasi, verifikasi, penghargaan, serta memantau data via dashboard analytics.

Alur utama:

1. Pendonor mendaftar dan melengkapi profil (golongan darah, domisili, berat badan).
2. Pasien/keluarga membuat permintaan darah darurat dan membagikan kartu permintaan (QR + kompatibilitas).
3. Pendonor yang cocok dan tersedia menghubungi koordinator atau menandai permintaan sebagai dipenuhi.
4. Donasi dicatat ke riwayat donor; verifikasi dan penghargaan memperkuat kredibilitas donor.
5. Data permintaan dan event donor darah disinkronkan otomatis dari sumber eksternal.

## Features

- **Donor Search** — Cari donor berdasarkan golongan darah, lokasi, dan ketersediaan, dengan filter wilayah dan geolokasi
- **Blood Requests** — Buat, bagikan, dan penuhi permintaan darah darurat; kartu share dengan QR + matriks kompatibilitas; tombol hubungi koordinator via WhatsApp
- **Blood Request Discovery** — Sinkronisasi permintaan darah dari sumber eksternal (Kawan Sedarah)
- **Event Discovery** — Temukan event donor darah dari PMI dan REST API eksternal; arsip event
- **Profile Discovery** — Sinkronisasi profil donor dari sumber eksternal
- **Donor History** — Catatan riwayat donasi + upload bukti
- **Donation Claims** — Klaim donasi lama yang belum tercatat, dengan review admin
- **Verification Levels** — Tingkat verifikasi donor (Self → Community → Verified), dengan pengajuan + review admin
- **Trust Score** — Skor kepercayaan donor yang dihitung dari aktivitas
- **Leaderboard** — Peringkat donor nasional dan regional
- **Timeline** — Feed aktivitas terpadu (riwayat, verifikasi, klaim, request, event)
- **Donor Passport** — Paspor digital dengan QR code; halaman verifikasi publik
- **Recognition & Awards** — Portofolio donor, konfigurasi penghargaan dan gelar (admin)
- **Admin Dashboard** — Statistik, manajemen pengguna, review klaim/verifikasi, kelola permintaan & report, analytics (institusi, kota, tahun, bulan, usia, top donor), konfigurasi penghargaan, trigger scrape manual, maintenance mode
- **Maintenance Mode** — Gate berbasis edge middleware dengan allowlist untuk halaman admin/auth
- **Partner Branding** — Halaman "Partner Kami" (Kawan Sedarah)

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 16.2.6 (App Router), React 19.2.4, TypeScript 5 |
| Styling | TailwindCSS 4, Base UI (`@base-ui/react`), glassmorphism ("Vitality Flow") |
| Database | PostgreSQL 16 (Supabase) via `@supabase/supabase-js` (REST) |
| Analytics | SQL agregasi via `pg` (raw Postgres pool, server-side) |
| Auth | Custom JWT (jsonwebtoken + bcryptjs), akses 15m + refresh rotation 7d |
| Storage | Vercel Blob (private, diproksi melalui `/api/v1/files`) |
| Upload | Multipart → `/api/v1/upload` → Vercel Blob `put()` |
| Email | Nodemailer via SMTP (opsional; kosong = skip email) |
| QR | `api.qrserver.com` (eksternal) |
| Scrapers | Axios + Cheerio (event / blood-request / profile discovery) |
| Container | Docker + Docker Compose (postgres + redis + frontend) |
| Scheduler | Supabase `pg_cron` + `pg_net` (discovery otomatis) + Vercel Cron (failsafe harian) |
| CI | GitHub Actions (`npm ci` + `npm run build`) |

> **Catatan:** service Redis tersedia di Docker Compose tetapi belum digunakan oleh kode.

## Requirements

- Node.js ≥ 22 (disarankan via `nvm`, lihat `.nvmrc`)
- npm (bundled dengan Node)
- Akun Supabase (project + URL + anon key + service key)
- Vercel Blob token (untuk fitur upload bukti/foto)
- Docker + Docker Compose (opsional, untuk postgres lokal & containerisasi)
- SMTP server (opsional, untuk verifikasi email & reset password)

## Getting Started

### Installation

```bash
nvm use 22          # atau: source "$HOME/.nvm/nvm.sh" && nvm use
npm ci
```

### Configuration

```bash
cp .env.example .env
```

Isi nilai pada `.env` sesuai tabel Environment Variables di bawah. Untuk pengembangan lokal dengan Docker:

```bash
docker compose up -d postgres redis
```

### Environment Variables

| Variable | Diperlukan | Deskripsi |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Ya | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Ya | Anon/public key (aman untuk client) |
| `SUPABASE_SERVICE_KEY` | Ya | Service role key — **server only** |
| `JWT_SECRET` | Ya | Kunci HMAC JWT — **server only**; ganti untuk production |
| `DATABASE_URL` | Migrasi & analytics | Connection string PostgreSQL langsung (migrasi + agregasi analytics admin) |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` / `DB_SSLMODE` | Docker lokal | Kredensial postgres lokal (`DB_HOST=postgres` di Compose, `localhost` di luar Docker) |
| `BLOB_READ_WRITE_TOKEN` | Upload | Token Vercel Blob — **server only** |
| `SMTP_HOST` | Email | Host SMTP; kosong = email nonaktif |
| `SMTP_PORT` | No | Default `587` |
| `SMTP_USER` / `SMTP_PASSWORD` | Email | Kredensial SMTP |
| `SMTP_FROM` | No | Default `noreply@ambildarahku.id` |
| `SEED_ADMIN_EMAIL` | Seed admin | Super admin dibuat otomatis saat migrasi; default password `admin123` (ubah via `SEED_ADMIN_PASSWORD`) |
| `SEED_ADMIN_PASSWORD` | No | Password super admin |
| `SEED_ADMIN_PHONE` | No | Phone super admin |
| `NEXT_PUBLIC_COORDINATOR_PHONE` | Kontak | Nomor koordinator (E.164) untuk semua tombol "Hubungi"; kosong = tombol disembunyikan |
| `APP_URL` | No | URL basis untuk link verifikasi email (default `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | No | URL publik frontend |
| `NEXT_PUBLIC_API_URL` | No | Base path API (default `/api/v1`) |
| `DOMAIN` | SEO | Domain untuk sitemap |
| `FRONTEND_PORT` | No | Port frontend (default `3000`) |
| `CRON_SECRET` | Scheduler | Bearer token untuk trigger discovery terjadwal — **wajib juga di-set di runtime env Vercel** |
| `SCRAPE_TARGET_URL` | Scheduler | Endpoint deploy, mis. `https://…/api/v1/discover` |
| `SCRAPE_INTERVAL_MINUTES` | No | Interval pg_cron (default `60`); terapkan ulang dengan `npm run migrate` |
| `VERCEL_CRON_EXPR` | No | Ekspresi cron Vercel yang dipercaya route `/api/v1/discover` (default `0 * * * *`) |
| `KS_ANON_KEY` | Discovery | Anon key Supabase Kawan Sedarah (sumber data eksternal) |

> **Security:** `SUPABASE_SERVICE_KEY`, `BLOB_READ_WRITE_TOKEN`, dan `JWT_SECRET` hanya boleh digunakan di server (API routes). Jangan pernah mengeksposnya ke browser. Hanya variabel ber-prefix `NEXT_PUBLIC_` yang aman untuk client.

### Running Locally

```bash
# Siapkan schema (20 tabel + index + admin seed + scheduler job)
npm run migrate

# Opsional: data developer
npm run seed

# Jalankan dev server
npm run dev
```

Buka `http://localhost:3000`. Akun seed donor memakai password `donor123`; super admin dibuat otomatis bila `SEED_ADMIN_EMAIL` di-set (password default `admin123`).

## Project Structure

```
ambildarahku/
├── src/
│   ├── app/
│   │   ├── page.tsx               # Landing page (live stats, partner)
│   │   ├── login/ register/       # Auth (register 3 langkah: profil → darah → domisili)
│   │   ├── forgot-password/ reset-password/ verify-email/
│   │   ├── profile/               # Dashboard donor (stats, verifikasi, trust, timeline)
│   │   ├── search/                # Pencarian donor
│   │   ├── requests/ requests/new/ requests/share/[id]/
│   │   ├── donor-history/         # Riwayat donasi + bukti upload
│   │   ├── claims/ claims/new/    # Klaim donasi
│   │   ├── verification/          # Level verifikasi + pengajuan
│   │   ├── leaderboard/ timeline/
│   │   ├── events/ events/new/ events/archive/
│   │   ├── passport/ passport/verify/[token]/   # + verifikasi QR publik (SSR)
│   │   ├── u/[username]/          # Portofolio publik (SSR)
│   │   ├── admin/ admin/analytics/ admin/awards/ admin/blood-requests/
│   │   │   └── admin/claims/ admin/reports/ admin/verifications/
│   │   ├── privacy/ terms/ maintenance/
│   │   ├── robots.txt sitemap.xml
│   │   └── api/v1/                # 73 route files (22 kelompok: auth, donors, requests,
│   │                              #   blood-requests, events, discover, admin, files, dll.)
│   ├── components/                # 14 komponen custom (GlassCard, Sidebar, dll.) + 9 UI primitives
│   ├── lib/                       # db.ts (Supabase lazy-init Proxy), pg.ts, auth-middleware.ts,
│   │                              #   jwt.ts, password.ts, email.ts, file.ts (Blob), eligibility.ts,
│   │                              #   trust-score.ts, blood-compatibility.ts, config.ts, api.ts,
│   │                              #   auth-context.tsx, data/wilayah.ts, hooks/,
│   │                              #   event-discovery/, blood-request-discovery/, profile-discovery/
│   ├── middleware.ts              # Edge middleware — maintenance gate + auth
│   └── utils/
├── scripts/
│   ├── migrate.ts                 # DDL idempotent (20 tabel + index + admin seed + scheduler job)
│   ├── reset-db.ts                # Drop semua → migrate ulang
│   ├── seed-dev.ts                # Data donor development
│   ├── seed-production-like.ts    # Data sintetis skala besar (SEED_SCALE)
│   ├── seed-wilayah.ts            # Reseed tabel wilayah_regions
│   ├── seed-profiles.ts           # Seed profil donor dari Kawan Sedarah
│   ├── split-wilayah.ts           # Regenerasi data wilayah + map kode lama→baru
│   ├── migrate-wilayah-codes.ts   # Remap kode wilayah lama pengguna
│   ├── discover-events.ts         # Trigger discovery event manual
│   └── test-privacy.ts test-scrape-lock.ts   # Smoke checks
├── public/
├── docker-compose.yml             # postgres + redis + frontend
├── Dockerfile                     # Multi-stage, node:22-alpine, standalone
├── next.config.ts                 # output: standalone; redirect /recognition → /passport
├── vercel.json                    # Cron harian untuk /api/v1/discover
├── .github/workflows/ci.yml       # CI: npm ci + npm run build
├── .env.example
├── PRD.md  DESIGN.md
└── package.json
```

## Usage

### Pengguna Umum (tanpa login)

- Mencari donor berdasarkan golongan darah dan lokasi
- Melihat daftar permintaan darah terbuka dan kartu share
- Melihat event donor darah
- Memverifikasi QR passport donor (`/passport/verify/[token]`)
- Melihat portofolio publik donor (`/u/[username]`), halaman privasi & syarat

### Donor (login)

- Registrasi 3 langkah + verifikasi email
- Mengelola status ketersediaan dan eligibilitas
- Mencatat riwayat donasi + upload bukti
- Mengajukan klaim donasi lama & meningkatkan level verifikasi
- Membuat/memenuhi permintaan darah, melihat timeline, leaderboard, passport digital, dan portofolio penghargaan

### Administrator (login `super_admin`)

- Dashboard statistik & analytics (institusi, kota, tahun, bulan, usia, top donor)
- Manajemen pengguna & role
- Review klaim donasi & pengajuan verifikasi
- Kelola permintaan darah & report
- Konfigurasi penghargaan/gelar
- Trigger scrape manual + melihat riwayat/job scheduler
- Toggle maintenance mode

## API / Integrations

- **Base path:** `/api/v1` (Next.js Route Handlers `route.ts`)
- **Auth:** Bearer JWT access token (15 menit) + refresh token rotation (7 hari); client `src/lib/api.ts` melakukan auto-refresh
- **Role gates:** `authRequired`, `adminRequired`, `emailVerifiedRequired` di `src/lib/auth-middleware.ts`

Kelompok endpoint utama: `auth` (register, login, refresh, logout, verify/resend email, forgot/reset/change password), `donors` (profil, status, pencarian), `requests` & `blood-requests` (permintaan, fulfill), `donor-history`, `claims`, `donor-verification`, `trust-score`, `leaderboard`, `timeline`, `passport`, `recognition`, `events`, `stats`, `reports`, `admin/*` (statistik, analytics, users, claims, verifications, awards, maintenance, scrape), `files` (proksi blob private), `upload`, `discover` (scheduler), `health`.

### Integrasi Eksternal

- **Supabase** — penyimpanan data utama via `@supabase/supabase-js` (REST); pool `pg` hanya untuk migrasi & agregasi analytics
- **Vercel Blob** — penyimpanan file private; diakses via proksi `/api/v1/files` (terima URL penuh maupun path-only)
- **SMTP (Nodemailer)** — verifikasi email & reset password
- **Kawan Sedarah** — sumber data sinkronisasi (permintaan darah + profil donor)
- **PMI websites + REST API** — sumber data event donor darah
- **QR Code** — `api.qrserver.com` (eksternal)

## Automatisasi Sinkronisasi (Discovery/Scraping)

- **Data yang disinkronkan:** event donor darah (dari website/REST PMI), permintaan darah (Kawan Sedarah), profil donor (Kawan Sedarah)
- **Cara kerja:** runner di `src/lib/event-discovery/`, `src/lib/blood-request-discovery/`, `src/lib/profile-discovery/`; rutin utama di `src/lib/discovery/`
- **Scheduler:** Supabase `pg_cron` + `pg_net` melakukan `POST` ke `/api/v1/discover` dengan `SCRAPE_TARGET_URL` pada interval `SCRAPE_INTERVAL_MINUTES` (job dijadwalkan saat `npm run migrate`). Membutuhkan `CRON_SECRET` — **wajib di-set juga di runtime env deployment**, jika tidak post dari pg_net ditolak diam-diam
- **Failsafe:** Vercel Cron (`vercel.json`) memicu sekali sehari (`0 18 * * *` / 01:00 WIB)
- **Manual:** via halaman admin scrape ("Scrape Now"); `npm run discover` untuk event
- **Keamanan trigger:** route `/api/v1/discover` hanya mempercayai `x-scheduled` + `CRON_SECRET` atau `x-vercel-cron`
- **Monitoring:** lock & riwayat eksekusi tercatat di tabel `scrape_jobs` / `scrape_runs`; halaman admin menampilkan run history + diagnostik `pg_cron_runs`
- **Fallback:** Postgres lokal tanpa `pg_cron`/`pg_net` hanya mendukung trigger manual (peringatan saat migrasi)

## Database

- **DBMS:** PostgreSQL 16 (Supabase Cloud untuk deploy; Docker `postgres:16-alpine` untuk lokal)
- **Akses di aplikasi:** semua API route memakai Supabase JS client (`supabase.from().select()`); endpoint analytics admin memakai SQL agregasi langsung via `pg` (membutuhkan `DATABASE_URL` saat runtime)
- **Migrasi:** DDL idempotent di `scripts/migrate.ts` — 20 tabel (`users`, `donor_histories`, `blood_requests`, `request_fulfillments`, `donation_claims`, `donor_verifications`, `badges`, `user_badges`, `award_configs`, `user_titles`, `donor_passports`, `refresh_tokens`, `verification_tokens`, `events`, `event_sources`, `wilayah_regions`, `config`, `scrape_jobs`, `scrape_runs`, `reports`) + index + seed admin + job scheduler
- **Setup:** `npm run migrate` (lokal butuh Postgres jalan, lihat `docker compose up -d postgres`)
- **Seed:** `npm run seed` (dev), `npm run seed:prod-like`, `npm run seed-wilayah`, `npm run seed-profiles`
- **Data wilayah:** tabel `wilayah_regions` + file JSON lazy-load per level (provinsi/kabupaten/kecamatan); kode wilayah disimpan sebagai ID numerik, diremapping via `npm run migrate:wilayah`

## Development

```bash
# Dev server (hot reload)
npm run dev

# Lint
npm run lint

# Build production
npm run build

# Jalankan production build
npm start
```

| Script | Fungsi |
|---|---|
| `npm run migrate` | Migrasi schema + admin seed + jadwalkan scheduler |
| `npm run reset` | Drop semua data → migrasi ulang (destruktif) |
| `npm run seed` | Seed data development |
| `npm run seed:prod-like` | Seed data sintetis skala produksi |
| `npm run seed-wilayah` | Reseed tabel wilayah |
| `npm run seed-profiles` | Seed profil donor dari Kawan Sedarah |
| `npm run split-wilayah` | Regenerasi data wilayah + map kode lama→baru |
| `npm run migrate:wilayah` | Remap kode wilayah lama pengguna |
| `npm run discover` | Trigger discovery event manual |
| `npm run test:privacy` | Smoke check privasi (data publik) |
| `npm run test:scrape-lock` | Smoke check lock scheduler |

## Deployment

### Vercel (Hobby plan)

1. Build: `npm run build` (CI GitHub Actions menjalankan `npm ci` + `npm run build` setiap push/PR ke `main`)
2. Set semua environment variables di dashboard Vercel (lihat tabel di atas), termasuk `SUPABASE_*`, `JWT_SECRET`, `BLOB_READ_WRITE_TOKEN`, dan **`CRON_SECRET` di runtime env** untuk scheduler
3. Scheduler discovery: set `SCRAPE_TARGET_URL` ke URL deploy (`https://…/api/v1/discover`); Vercel Cron (`vercel.json`) memicu failsafe harian
4. Verifikasi: halaman `/api/v1/health`, login admin, halaman admin scrape untuk status job

### Docker Compose

```bash
docker compose up --build
```

Service: `postgres` (16-alpine, volume persist), `redis` (7-alpine), `frontend` (Dockerfile multi-stage, `node:22-alpine`, output standalone). Env dibaca dari `.env` / `.env.local`; lihat `docker-compose.yml`.

> Lokal tanpa Supabase: migrasi memakai `DB_*` vars, namun runtime tetap membutuhkan Supabase URL/keys untuk API routes.

## Responsive Design

Aplikasi mendukung tampilan mobile, tablet, dan desktop — navigasi memakai sidebar desktop dan bottom-nav/drawer di mobile.

## Security & Privacy

- **JWT:** access token 15 menit + refresh token rotation 7 hari; refresh token di-invalidate setiap digunakan; password di-hash dengan bcrypt
- **Secrets:** `SUPABASE_SERVICE_KEY`, `BLOB_READ_WRITE_TOKEN`, `JWT_SECRET` murni server-side (tidak di-`NEXT_PUBLIC_`)
- **File:** blob bersifat private, hanya diakses via proksi ber-auth `/api/v1/files`
- **Public pages (SSR)** hanya menampilkan field publik; endpoint terproteksi memerlukan role `super_admin` / auth
- **Discovery endpoint** tidak dapat dipicu publik — hanya `CRON_SECRET` / `x-vercel-cron`
- **Gap yang diketahui:** CORS mengizinkan semua origin (`*`), nomor telepon terekspos di API pencarian donor, tidak ada rate limiting (kecuali forgot-password 1x/menit), tidak ada audit logging, tidak ada test otomatis
- **Aturan donasi:** volume 0.35 L/bag untuk ≤55 kg dan 0.45 L/bag untuk >55 kg; interval minimal 56 hari; range usia 18–65

## Troubleshooting

### Login/registrasi gagal (500)
Periksa `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, dan `SUPABASE_SERVICE_KEY` di `.env`.

### `npm run migrate` gagal
- Pastikan Postgres berjalan: `docker compose up -d postgres`
- Pastikan `DATABASE_URL` (Supabase) atau `DB_*` vars (lokal) benar; ekstensi `uuid-ossp` tersedia
- Reset: `npm run reset` (destruktif)

### Upload bukti gagal / error blob
Set `BLOB_READ_WRITE_TOKEN` di Vercel Blob store.

### Scheduler discovery tidak jalan
1. Set `SCRAPE_TARGET_URL` + `CRON_SECRET`, jalankan ulang `npm run migrate` untuk menjadwalkan ulang job
2. Pastikan `CRON_SECRET` juga terpasang di runtime env deployment (Vercel) — jika tidak, post pg_net ditolak diam-diam
3. Cek run history & `pg_cron_runs` di halaman admin scrape

### "invalid or expired token"
Access token berumur 15 menit; client seharusnya auto-refresh. Periksa sinkronisasi jam sistem (JWT memakai timestamp).

### "email/phone already registered"
Constraint unik di tabel `users` (`email`, `phone`). Gunakan email/phone berbeda atau hapus data lama.

### Data wilayah lama tidak cocok
Kode wilayah lama (numerik legacy) dapat di-remap dengan `npm run migrate:wilayah` setelah `npm run split-wilayah`.

## Contributing

1. Fork repository dan buat branch fitur (`feat/…`, `fix/…`)
2. Jalankan verifikasi sebelum PR: `npm run lint`, `npm run build`, dan smoke checks (`npm run test:privacy`, `npm run test:scrape-lock`)
3. Buka pull request ke `main` (CI otomatis menjalankan build)
5. Untuk perubahan skema DB: perbarui `scripts/migrate.ts` (DDL idempotent)

## License

MIT — lihat [LICENSE](LICENSE).

