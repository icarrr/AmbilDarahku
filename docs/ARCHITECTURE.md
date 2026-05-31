# Architecture — AmbilDarahku

## High-Level Architecture

```
┌──────────────┐      ┌──────────────────┐      ┌────────────┐
│   Next.js 16  │─────▶│   Go Gin API     │─────▶│ PostgreSQL │
│   Frontend    │HTTP  │   :8080          │ SQL  │    :5432   │
│   :3000       │      │                  │      │            │
└──────────────┘      └──────┬───────────┘      └────────────┘
       │                     │                           │
       │              ┌──────▼───────────┐      ┌────────▼────┐
       │              │   MinIO / S3     │      │    Redis    │
       │              │   :9000          │      │    :6379    │
       │              │   (File Storage) │      │  (Declared  │
       │              └──────────────────┘      │   but not   │
       │                                        │   used yet) │
       │                                        └─────────────┘
  OpenStreetMap
  (declared only,
   not integrated)
```

## Application Architecture (Backend)

```
┌─────────────────────────────────────────────────────────────┐
│ cmd/server/main.go                                          │
│  ├─ config.Load()                                           │
│  ├─ database.NewPostgres() → sqlx.DB                        │
│  ├─ database.RunMigrations()                                │
│  ├─ repositories.*                                          │
│  ├─ seed.SeedAdmin()                                        │
│  └─ routes.Setup() → gin.Engine                             │
│       └─ r.Run(":8080")                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ routes/router.go                                            │
│  ├─ Public group (/api/v1)                                  │
│  │   ├─ GET /health                                         │
│  │   ├─ POST /auth/register, /auth/login, /auth/refresh     │
│  │   ├─ GET /u/:username, /requests, /donors                │
│  │   └─ GET /leaderboard/national, /leaderboard/regional    │
│  ├─ Auth group (JWT required)                               │
│  │   ├─ GET/PUT /auth/me, POST /auth/logout                 │
│  │   ├─ GET/POST /donor-history                             │
│  │   ├─ POST /requests, GET /requests/mine                  │
│  │   ├─ PUT /requests/:id/status                            │
│  │   └─ GET/PUT /donor-status                               │
│  └─ Admin group (super_admin only)                          │
│       ├─ GET /admin/users                                   │
│       └─ PUT /admin/users/:id/role                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Layered Architecture (per request)                          │
│                                                             │
│  Handler (HTTP binding)                                     │
│    └─ Service (business logic)                               │
│         └─ Repository (data access)                          │
│              └─ sqlx.DB (PostgreSQL)                         │
│                                                             │
│  Some handlers skip Service layer (e.g., donor_history,     │
│  blood_request operate directly on repo from handler)       │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ layout.tsx (Root Layout)                                    │
│  ├─ AuthProvider (context)                                  │
│  ├─ DesktopSidebar (md+)                                    │
│  ├─ Navbar (sticky top)                                     │
│  ├─ main > {children}                                       │
│  ├─ BottomNav (mobile fixed)                                │
│  └─ Toaster (sonner)                                        │
│                                                             │
│ Pages (all under src/app/)                                  │
│  ├─ page.tsx — Landing (server component)                   │
│  ├─ login/ — Login page (client component)                  │
│  ├─ register/ — 3-step registration form (client component) │
│  ├─ profile/ — Donor dashboard (client component)           │
│  ├─ search/ — Donor search w/ filters (client component)    │
│  ├─ admin/ — User management (client component)             │
│  ├─ donor-history/ — Donation history (client component)    │
│  ├─ leaderboard/ — Rankings (client component)              │
│  ├─ [username]/ — Public portfolio (SSR, async component)   │
│  └─ requests/                                               │
│       ├─ new/ — Emergency request (client component)        │
│       └─ share/[id]/ — Shareable request card (client)      │
└─────────────────────────────────────────────────────────────┘
```

## Authentication Flow

```
Registration:
  1. Client POST /auth/register → { user, access_token, refresh_token }
  2. Client stores tokens in localStorage
  3. AuthProvider sets user state

Login:
  1. Client POST /auth/login → { user, access_token, refresh_token }
  2. Client stores tokens in localStorage
  3. AuthProvider sets user state

Token Refresh (automatic in api.ts):
  1. API call returns 401
  2. api.ts POST /auth/refresh with refresh_token
  3. Server validates hash, deletes old, issues new pair (rotation)
  4. Retries original request with new access_token
  5. If refresh fails → redirect to /login

Logout:
  1. POST /auth/logout → deletes all refresh tokens for user
  2. Clears localStorage
  3. Sets user to null
```

## Data Flow — Donor Search

```
User selects filters → api.get("/donors?blood_type=A&rhesus=+&city=Jakarta")
  → GET /api/v1/donors
  → search_handler.Search() reads query params
  → user_repository.Search() builds dynamic WHERE
  → Returns matched donors (includes phone number)
  → Frontend displays donor cards with WhatsApp buttons
```

---

## External Integrations

| Integration | Status | Details |
|---|---------|---------|
| WhatsApp (wa.me) | Implemented | `backend/internal/services/whatsapp_service.go` generates wa.me links with pre-filled message templates |
| MinIO / S3 | Implemented | `backend/internal/services/file_service.go` handles upload, but `GetPublicURL` returns "TODO" — incomplete |
| Redis | Declared | In docker-compose.yml, config, but no actual usage in code |
| OpenStreetMap + Leaflet | Declared only | Not integrated in any frontend component |
| PMI Integration | Planned (Phase 3) | Not implemented |
| Hospital Integration | Planned (Phase 3) | Not implemented |
| Event Management | Planned (Phase 2) | Not implemented |
| Donor Certificate (PDF/PNG) | Planned | Not implemented |
