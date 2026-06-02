<div align="center">
  <h1>AmbilDarahku</h1>
  <p><strong>Temukan Donor Darah Lebih Cepat</strong></p>
  <p>Platform donor darah berbasis komunitas. Bangun jaringan donor, cari donor terdekat, dan selamatkan nyawa.</p>
</div>

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | Next.js 16.2.6, TypeScript 5, TailwindCSS 4, Base UI (shadcn/ui) |
| **Backend** | Go 1.26, Gin Framework 1.12 |
| **Database** | PostgreSQL 16 (sqlx + lib/pq) |
| **Cache** | Redis 7 (declared, unused) |
| **Storage** | MinIO / S3 Compatible (mock fallback) |
| **Container** | Docker, Docker Compose |
| **CI** | GitHub Actions |

## Quick Start

```bash
cp .env.example .env          # Edit JWT_SECRET for production
docker compose up --build
```

| Service | URL |
|---|---|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:8080 |
| PostgreSQL | localhost:5432 |
| MinIO Console | http://localhost:9001 |

Migrations and seed data run automatically on backend startup (seed in background ~20 min).

### Development (hot reload)

```bash
docker compose up -d postgres redis minio   # infra only
cd backend && go run ./cmd/server           # API on :8080
source "$HOME/.nvm/nvm.sh" && nvm use v20
cd frontend && npm run dev                  # UI on :3000
```

## Features

### Authentication & Security
- Register (12 fields, no rhesus/lat/lng), login, JWT refresh rotation (15m/7d)
- **Email verification** — optional SMTP with branded HTML templates; `SMTP_FROM` fallback `SMTP_SENDER`
- **Password management** — forgot/reset via token, change with current password, 1-min rate limit
- **Unverified user restriction** — blocked from most features; frontend + backend enforcement

### Donor Eligibility Engine (pkg/eligibility/)
- Modular rules: AgeRule (17-60 first, 65 repeat), WeightRule (≥45kg), DonationIntervalRule (56 days)
- Statuses: `eligible`, `waiting_period`, `not_eligible`, `needs_clearance`
- Availability: auto mode (syncs with eligibility) or manual (reason + ready_again_date)
- Search priority: P1 (eligible+available) → P4 (other)

### Blood Compatibility Matrix
- Full ABO + Rh rules: O- universal donor, AB+ universal recipient
- Search by `compatible_with` param; share card shows compatible donor badges
- Rhesus removed from UI (defaults to "+" in backend)

### Donor Search
- Filter by blood type, city, availability, distance (haversine)
- Auth-gated (JWT), sorted by distance + priority
- Clickable cards → `/u/[username]`; WhatsApp contact per donor

### Emergency Blood Requests
- Create with patient info, urgency (critical/urgent/normal), blood type compatibility hint
- Share card (`/requests/share/[id]`) with QR code, progress bar, WhatsApp link
- "Saya Sudah Donor" button with compatibility guard + eligibility tooltip
- Fulfill creates auto-verified donor history (duplicate-date guard — 409)

### Donor History
- Record donation date, location, institution, bags, notes, proof photo
- Verification (pending/verified/rejected), auto-verify on photo upload
- Volume: ≤55kg → 0.35L/bag, >55kg → 0.45L/bag
- Stats refresh on each entry (auto-awards badges)

### Badge System (auto-awarded)
| Badge | Donations |
|---|---|
| First Drop | 1 |
| Lifesaver | 5 |
| Hero | 10 |
| Guardian | 25 |
| Legend | 50 |
| Blood Champion | 100 |

### Leaderboard
- National (top 100) + Regional (top 50 by city) with animated gold/silver/bronze podium
- Current user highlighted in red

### Phase 1 — National Donor Passport
- Passport number (ADK-YYYY-NNNNNN), QR token (64-char hex), renew, print
- Public QR verification page (SSR)

### Phase 1 — Historical Donation Claims
- Submit pending claim with evidence; admin/PMI approves or rejects with reason
- Approved claims trigger stats refresh (no duplicate history record)

### Phase 1b — Verification Framework
- Levels: 0 (none) → 1 (self) → 2 (community) → 3 (PMI); auto-updates on approval

### Phase 1b — Unified Timeline
- Visual feed across donations, claims, and badges (UNION query, paginated)

### Phase 2 — Award Engine & Recognition
- Admin-defined award configs (title/badge/certificate, JSON criteria, scope)
- Printable recognition portfolio with QR code, titles, badges, stats

### Phase 3 — PMI Review Portal
- Review queue for claims + verifications with user info
- Dedicated admin pages for each queue

### Phase 4 — Trust Dashboard & Analytics
- Trust score: 5 components (donation count 30%, verification 30%, claim accuracy 20%, profile 10%, age 10%)
- Analytics: institutions, cities, monthly, yearly, age distribution, top donors
- Bar chart visualizations

### Events
- Blood drive events with countdown, progress bar, gradient accents
- Admin creates; public lists upcoming

### Admin Panel
- User management (list, change roles), award config CRUD
- Analytics dashboards

## API Endpoints (50+)

All under `/api/v1`. See `docs/API.md` for full reference.

### Public (14)
`/health`, `/stats`, `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/verify-email`, `/auth/forgot-password`, `/auth/reset-password`, `/u/:username`, `/requests`, `/leaderboard/*`, `/events`, `/passport/verify/:token`, `/passport/:username`, `/timeline/:username`, `/recognition/:username`, `/trust-score/:username`

### Authenticated (10)
`/donors`, `/auth/me` (GET/PUT), `/auth/logout`, `/auth/resend-verification`, `/auth/change-password`

### Verified Email (18)
`/donor-history` (CRUD), `/requests` (CRUD + fulfill), `/donor-status`, `/donor-verification`, `/passport`, `/claims`, `/timeline`, `/recognition`, `/trust-score`

### Admin (9)
`/admin/users`, `/admin/users/:id/role`, `/events`, `/admin/awards`, `/admin/titles`

### PMI Review (8)
`/admin/stats`, `/admin/claims`, `/admin/verifications`, `/admin/analytics/*` (6)

## Project Structure

```
ambildarahku/
├── backend/
│   ├── cmd/server/main.go              # Entry point
│   ├── internal/
│   │   ├── config/                     # Env config (SMTP_FROM fallback)
│   │   ├── database/                   # PostgreSQL + 14-table migrations
│   │   ├── handlers/                   # 16 HTTP handler files
│   │   ├── middleware/                 # JWT auth, admin, PMI, email-verified
│   │   ├── models/                     # 11 model structs
│   │   ├── repositories/              # 13 data access files
│   │   ├── routes/                     # 50+ route registration
│   │   └── services/                   # 6 business logic files
│   ├── pkg/
│   │   ├── blood/                      # ABO+Rh compatibility matrix
│   │   ├── eligibility/               # Rule engine (age, weight, interval)
│   │   └── utils/                      # JWT generation, bcrypt
│   ├── seed/                           # Admin seeder + 1,500 dummy donors
│   ├── Dockerfile                      # Multi-stage (golang→alpine)
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── app/                        # 30 page.tsx across 27 routes
│   │   ├── components/                 # 22 reusable components
│   │   └── lib/                        # API client, auth context, utils, blood compat
│   ├── Dockerfile                      # Multi-stage (node:20-alpine, standalone)
│   └── package.json
├── docker-compose.yml                  # 5 services
├── .github/workflows/ci.yml            # Go + Node CI pipeline
├── .env.example                        # Config template
├── DESIGN.md                           # Vitality Flow design system
└── docs/                               # 11 documentation files
```

## Configuration

Key env vars (see `.env.example`):

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | — | JWT signing secret (required, change in production) |
| `DB_HOST` | localhost | PostgreSQL host |
| `SMTP_HOST` | — | SMTP server (empty = email is no-op) |
| `SMTP_FROM` | — | SMTP sender (fallback: `SMTP_SENDER`) |
| `S3_ENDPOINT` | — | S3/MinIO endpoint (empty = mock returns fake URL) |
| `APP_URL` | http://localhost:3000 | Frontend URL (for email links) |
| `SEED_ADMIN_EMAIL` | — | Set to auto-create super admin on startup |
| `SEED_DUMMY` | false | Set `true` to seed 1,500+ dummy donors |

## Development Notes

- **No Go toolchain in workspace** — verify Go changes by pattern matching
- **No npm/node directly in PATH** — use `source "$HOME/.nvm/nvm.sh" && nvm use v20`
- **Rhesus** — not shown in UI ever; backend defaults to `"+"` (DB column NOT NULL)
- **Seed password** — all dummy accounts use `donor123`
- **QR code** — uses `api.qrserver.com` (no local QR library installed)
- **File upload** — S3 driver with mock fallback (returns fake URL if S3 env not set)

---

© 2025 Faizar Septiawan. All rights reserved.
