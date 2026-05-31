# AI Agent Guide — AmbilDarahku

## Project Overview

**AmbilDarahku** is a community-based blood donor platform connecting blood donors with those in need. Built as a monorepo with a Go (Gin) backend API and Next.js frontend.

- **Business Purpose**: Reduce blood donor search time during emergencies through a verified community network
- **Target Market**: Indonesia (Indonesian language interface with Indonesian locale data)
- **Owner**: Faizar Septiawan
- **Stage**: MVP / Phase 1

---

## Read Documentation In This Order

Future AI agents should load these files first (priority order):

1. `docs/AGENTS.md` — This file (entry point)
2. `docs/ARCHITECTURE.md` — System architecture overview
3. `docs/API.md` — All API endpoints, request/response examples
4. `docs/DATABASE.md` — Schema, tables, relationships, indexes
5. `docs/FEATURES.md` — All features by domain, user roles
6. `docs/BUSINESS_RULES.md` — Business logic and validation rules
7. `docs/INFRASTRUCTURE.md` — Docker, deployment, CI/CD
8. `docs/DECISIONS.md` — Architecture decisions and trade-offs
9. `docs/TROUBLESHOOTING.md` — Common issues
10. `PRD.md` — Product requirements (reference)
11. `DESIGN.md` — Design system (Vitality Flow)

You generally do NOT need to scan the full source tree. Start with these docs.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript 5, TailwindCSS 4, Base UI (shadcn/ui) |
| Backend | Go 1.26, Gin Framework 1.12 |
| Database | PostgreSQL 16 (via sqlx and lib/pq) |
| Cache | Redis 7 (declared but not yet integrated in code) |
| Storage | MinIO / S3-compatible (MinIO dev, Cloudflare R2/AWS S3 prod) |
| Maps | OpenStreetMap + Leaflet (declared but not yet integrated) |
| Auth | JWT (golang-jwt v5), bcrypt password hashing |
| Container | Docker, Docker Compose |
| CI | GitHub Actions |

---

## Repository Map

```
ambildarahku/
├── backend/                          # Go API server
│   ├── cmd/server/main.go            # Entry point
│   ├── internal/
│   │   ├── config/config.go          # Env config loader
│   │   ├── database/
│   │   │   ├── postgres.go           # DB connection (sqlx)
│   │   │   └── migrations.go         # Auto-run schema migrations
│   │   ├── handlers/                 # HTTP handlers (7 files)
│   │   │   ├── auth_handler.go       # Register, Login, Refresh, Logout
│   │   │   ├── user_handler.go       # Profile CRUD, admin user mgmt
│   │   │   ├── blood_request_handler.go
│   │   │   ├── donor_history_handler.go
│   │   │   ├── donor_status_handler.go
│   │   │   ├── leaderboard_handler.go
│   │   │   └── search_handler.go
│   │   ├── middleware/
│   │   │   ├── auth.go              # JWT auth + admin check
│   │   │   └── cors.go             # CORS middleware
│   │   ├── models/                   # 6 domain models
│   │   ├── repositories/            # 6 data access repositories
│   │   ├── routes/router.go         # Route registration
│   │   ├── services/                 # Business logic (4 services)
│   │   └── seed/admin.go            # Super admin seeder
│   ├── pkg/utils/
│   │   ├── jwt.go                   # Token generation
│   │   └── password.go              # bcrypt hash/verify
│   ├── Dockerfile
│   └── go.mod / go.sum
├── frontend/                         # Next.js SPA
│   ├── src/
│   │   ├── app/                      # Next.js App Router pages
│   │   │   ├── page.tsx             # Landing page
│   │   │   ├── layout.tsx           # Root layout (glassmorphism)
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx     # 3-step registration form
│   │   │   ├── profile/page.tsx     # Donor dashboard
│   │   │   ├── search/page.tsx      # Donor search with filters
│   │   │   ├── admin/page.tsx       # Admin user management
│   │   │   ├── donor-history/page.tsx
│   │   │   ├── leaderboard/page.tsx
│   │   │   ├── [username]/page.tsx   # Public portfolio (SSR)
│   │   │   └── requests/
│   │   │       ├── new/page.tsx     # Emergency request form
│   │   │       └── share/[id]/page.tsx
│   │   ├── components/               # 10 reusable components
│   │   ├── components/ui/           # 6 shadcn/ui components
│   │   └── lib/
│   │       ├── api.ts              # API client with JWT refresh
│   │       ├── auth-context.tsx     # Auth state provider
│   │       └── utils.ts            # cn() utility
│   ├── Dockerfile                   # Multi-stage (standalone output)
│   └── package.json
├── docker-compose.yml               # 5 services
├── .github/workflows/ci.yml         # CI pipeline
├── .env.example                     # Config template
├── PRD.md                           # Product requirements doc
├── DESIGN.md                        # Vitality Flow design system
└── README.md                        # Quick start guide
```

---

## Project Rules

1. **Language**: Source code in English; UI strings in Indonesian
2. **Backend pattern**: Handler → Service → Repository (no direct DB in handlers)
3. **Frontend pattern**: Pages use `"use client"` (client components); public portfolio is SSR
4. **Auth**: JWT access + refresh token rotation (refresh token invalidated on use)
5. **DB Migrations**: Auto-run on startup in `main.go` — no separate migration tool
6. **Env config**: `.env` file loaded by godotenv in config; frontend uses `NEXT_PUBLIC_API_URL`
7. **Style**: Glassmorphism design system ("Vitality Flow"), defined in `DESIGN.md`
8. **Next.js**: Uses a very new version (16.2.6) with breaking changes; check `node_modules/next/dist/docs/`
9. **UI Library**: Base UI React components from `@base-ui/react`, NOT Radix UI
10. **Testing**: No tests exist yet (backend or frontend)

---

## Development Workflow

```bash
# Start infrastructure only
docker compose up -d postgres redis minio

# Backend hot reload
cd backend && go run ./cmd/server

# Frontend hot reload
cd frontend && npm run dev
```

---

## Deployment Workflow

No production deployment config exists. Only Docker Compose for local dev. CI runs:
- Backend: `go mod tidy`, `go vet`, `go build`
- Frontend: `npm ci`, `npm run build`

---

## Security Notes

- JWT secret must be changed in production (`JWT_SECRET`)
- Phone numbers are exposed via API (search results include phone) — this is a known privacy gap vs PRD spec
- CORS allows all origins (`*`)
- No rate limiting implemented
- No audit logging implemented
- No HTTPS config in infrastructure
