# AI Agent Guide — AmbilDarahku (v3.0)

## Project Overview

**AmbilDarahku** — Platform donor darah berbasis komunitas untuk Indonesia. Monorepo: Go/Gin backend + Next.js 16 frontend. JWT auth with refresh rotation, glassmorphism UI ("Vitality Flow"), PostgreSQL 16, Docker Compose (5 services).

All seed accounts use password: `donor123`.

**Owner**: Faizar Septiawan

## Load Documentation In This Order

1. `docs/AGENTS.md` — This file (entry point)
2. `docs/ARCHITECTURE.md` — System architecture
3. `docs/API.md` — Complete API reference (50+ endpoints)
4. `docs/DATABASE.md` — Schema (14 tables, columns, indexes)
5. `docs/FEATURES.md` — Feature inventory per domain
6. `docs/BUSINESS_RULES.md` — Business logic + validation rules
7. `docs/INFRASTRUCTURE.md` — Docker, CI/CD, deployment
8. `docs/DECISIONS.md` — Key architecture decisions
9. `docs/TROUBLESHOOTING.md` — Common issues
10. `PRD.md` — Product requirements
11. `DESIGN.md` — Vitality Flow design system

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.2.6, TypeScript 5, TailwindCSS 4, Base UI (shadcn/ui) |
| Backend | Go 1.26, Gin Framework 1.12 |
| Database | PostgreSQL 16 (sqlx + lib/pq) |
| Cache | Redis 7 (declared, not used in code) |
| Storage | MinIO / S3-compatible (mock fallback if env not set) |
| Auth | JWT (golang-jwt v5), bcrypt password hashing |
| Maps | OpenStreetMap + Leaflet (declared, not integrated) |
| QR | `api.qrserver.com` (no local QR library) |
| Container | Docker, Docker Compose |
| CI | GitHub Actions |

## Repository Map

```
ambildarahku/
├── backend/
│   ├── cmd/server/main.go            # Entry point — config→db→migrate→seed→routes→listen
│   ├── internal/
│   │   ├── config/config.go          # Env loader (SMTP_FROM fallback SMTP_SENDER)
│   │   ├── database/
│   │   │   ├── postgres.go           # sqlx.Connect
│   │   │   └── migrations.go         # 14 tables + ALTER TABLE (idempotent)
│   │   ├── handlers/                 # 16 handler files
│   │   │   ├── auth_handler.go       # Register, Login, Refresh, Logout, VerifyEmail, Resend, Forgot/Reset/ChangePassword
│   │   │   ├── user_handler.go       # GetProfile, UpdateProfile, ListAll, UpdateUserRole, GetPublicProfile
│   │   │   ├── donor_history_handler.go  # List, Create, Update
│   │   │   ├── blood_request_handler.go  # Create, ListOpen, MyRequests, UpdateStatus, Fulfill, GetByID, ListFulfillments
│   │   │   ├── donor_status_handler.go   # GetStatus, UpdateStatus
│   │   │   ├── search_handler.go         # Search (donors with distance + state)
│   │   │   ├── leaderboard_handler.go    # National, Regional
│   │   │   ├── event_handler.go          # List, Create (admin)
│   │   │   ├── passport_handler.go       # GetMyPassport, GetByUsername, VerifyByQR, Request, Renew
│   │   │   ├── claim_handler.go          # ListMy, Get, Create, Update, Cancel, Review (admin), ListPending (admin)
│   │   │   ├── verification_handler.go   # GetMy, Submit, Review (admin), ListPending (admin)
│   │   │   ├── timeline_handler.go       # GetMyTimeline, GetPublicTimeline
│   │   │   ├── recognition_handler.go    # GetPortfolio, GetPublicPortfolio, List/Create/Update/Delete Awards (admin), AwardTitle (admin), ListAllTitles (admin)
│   │   │   ├── admin_handler.go          # GetStats, ListPendingClaims, GetClaimDetail, ListPendingVerifications
│   │   │   ├── trust_handler.go          # GetOwn, GetPublic, Refresh
│   │   │   └── analytics_handler.go      # 6 analytics endpoints (institutions, cities, years, months, age, top-donors)
│   │   ├── middleware/
│   │   │   ├── auth.go                  # AuthRequired (JWT), AdminRequired, PMIOrAdminRequired, EmailVerifiedRequired
│   │   │   └── cors.go                  # Allow-all CORS
│   │   ├── models/                      # 11 model files (User, DonorHistory, BloodRequest, Event, Badge+UserBadge, RefreshToken, VerificationToken, DonorPassport, DonationClaim, DonorVerification, AwardConfig+UserTitle)
│   │   ├── repositories/                # 13 repository files
│   │   ├── routes/router.go             # 50+ routes with middleware stacking
│   │   └── services/                    # 6 service files (auth, email, status, file, trust, whatsapp)
│   ├── pkg/
│   │   ├── blood/compatibility.go       # Full ABO+Rh compatibility matrix
│   │   ├── eligibility/                 # Rule engine (AgeRule, WeightRule, IntervalRule)
│   │   └── utils/                       # jwt.go, password.go
│   ├── seed/
│   │   ├── admin.go                    # Super admin seeder
│   │   └── dummy.go                    # 1,500+ donors, 60 requests, 29 events (background goroutine)
│   ├── Dockerfile                      # Multi-stage (golang→alpine)
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── app/                        # 30 page.tsx across 27 routes
│   │   │   ├── page.tsx               # Landing page (live stats)
│   │   │   ├── login/                 # Login form
│   │   │   ├── register/              # 3-step registration (profile→blood→domicile)
│   │   │   ├── forgot-password/       # Forgot password form
│   │   │   ├── reset-password/        # Password reset (Suspense)
│   │   │   ├── verify-email/          # Email verification (Suspense, refreshUser)
│   │   │   ├── profile/               # Dashboard with stats, ring, verification, trust, timeline, edit
│   │   │   ├── search/                # Donor search (filters, geolocation, clickable cards)
│   │   │   ├── requests/              # Blood request list
│   │   │   ├── requests/new/          # New blood request form
│   │   │   ├── requests/share/[id]/   # Share card with QR + compatibility + fulfill
│   │   │   ├── donor-history/         # Donation log + proof upload
│   │   │   ├── leaderboard/           # National/regional with podium
│   │   │   ├── events/                # Event listing
│   │   │   ├── events/new/            # Create event (admin)
│   │   │   ├── passport/              # Donor passport with QR + print
│   │   │   ├── passport/verify/[token]/  # Public QR verification (SSR)
│   │   │   ├── claims/                # Donation claims list
│   │   │   ├── claims/new/            # New claim form
│   │   │   ├── verification/          # Verification levels + submit
│   │   │   ├── timeline/              # Unified activity feed
│   │   │   ├── recognition/           # Printable portfolio
│   │   │   ├── admin/                 # Dashboard + user management
│   │   │   ├── admin/analytics/       # Analytics (bar charts)
│   │   │   ├── admin/verifications/   # Review verification requests
│   │   │   ├── admin/claims/          # Review donation claims
│   │   │   ├── admin/awards/          # Award config CRUD
│   │   │   ├── u/[username]/          # Public portfolio (SSR)
│   │   │   ├── privacy/               # Privacy policy (SSR)
│   │   │   └── terms/                 # Terms of service (SSR)
│   │   ├── components/                # 22 components (10 display + 9 UI + 3 nav)
│   │   └── lib/                       # api.ts, auth-context.tsx, utils.ts, blood-compatibility.ts
│   ├── Dockerfile                     # Multi-stage (node:20-alpine, standalone)
│   └── package.json                   # next 16.2.6, react 19, base-ui, tailwind v4
├── docker-compose.yml                 # 5 services (postgres, redis, minio, backend, frontend)
├── .github/workflows/ci.yml           # Lint + build both stacks
├── .env.example                       # Config template
├── PRD.md                             # Product requirements
├── DESIGN.md                          # Vitality Flow design system
├── README.md                          # Quick start
└── docs/                              # 11 documentation files
```

## Project Rules

1. **UI language**: Indonesian (`id-ID` locale, Indonesian labels/text)
2. **Code language**: English (source code, comments, variable names)
3. **Backend pattern**: Handler → Service → Repository (no direct DB in handlers)
4. **Frontend pattern**: Pages use `"use client"` (client components); public portfolio, passport verify, privacy, terms are SSR
5. **Auth**: JWT access (15m) + refresh token rotation (7d); refresh token invalidated on use
6. **DB Migrations**: Auto-run idempotent DDL on startup — no migration tool
7. **Rhesus**: Removed from all frontend UI; backend defaults to `"+"` on insert (DB column NOT NULL)
8. **Donation volume**: ≤55 kg → 0.35 L/bag, >55 kg → 0.45 L/bag
9. **Password**: All seed dummy accounts use `donor123`
10. **Next.js 16.2.6**: `params` is `Promise<T>` — unwrapped with `use()`; `useSearchParams()` requires `<Suspense>`
11. **UI library**: `@base-ui/react`, NOT Radix UI
12. **Testing**: No tests exist yet
13. **SMTP**: Optional; `SMTP_FROM` (fallback `SMTP_SENDER`); no-op when `SMTP_HOST` empty

## Development Workflow

```bash
# Start infrastructure
docker compose up -d postgres redis minio

# Backend hot reload
cd backend && go run ./cmd/server

# Frontend hot reload (nvm needed)
source "$HOME/.nvm/nvm.sh" && nvm use v20
cd frontend && npm run dev
```

## Key Env Vars

| Variable | Default | Notes |
|---|---|---|
| `JWT_SECRET` | — | Required; change for production |
| `DB_HOST` | localhost | `postgres` in Docker |
| `SMTP_HOST` | — | Empty = email is no-op |
| `SMTP_FROM` | — | Fallback `SMTP_SENDER` |
| `S3_ENDPOINT` | — | Empty = mock file service (returns fake URL) |
| `SEED_ADMIN_EMAIL` | — | Set to auto-create super admin |
| `APP_URL` | http://localhost:3000 | Used in email verification links |

## Security Notes

- CORS allows all origins (`*`)
- Phone numbers exposed in search API (known privacy gap vs PRD)
- No rate limiting (except forgot-password: 1 req/min)
- No audit logging
- No HTTPS
- No tests
