# Architecture — AmbilDarahku

## High-Level Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌────────────┐
│   Next.js 16  │────▶│   Go Gin API     │────▶│ PostgreSQL │
│   Frontend    │HTTP │   :8080          │ SQL │    :5432   │
│   :3000       │     │                  │     │            │
└──────────────┘     └──────┬───────────┘     └────────────┘
                            │                        
                     ┌──────▼───────────┐     
                     │   MinIO / S3     │     
                     │   :9000          │     
                     │   (mock fallback │     
                     │    if no S3 env) │     
                     └──────────────────┘     
```

## Application Architecture (Backend)

```
cmd/server/main.go
 ├─ config.Load()
 ├─ database.NewPostgres() → sqlx.DB
 ├─ database.RunMigrations()  (14 tables + ALTER TABLE)
 ├─ badgeRepo.SeedDefaults()
 ├─ seed.SeedAdmin() (optional)
 ├─ go seed.SeedDummy(db) (background, if SEED_DUMMY=true)
 └─ routes.Setup() → gin.Engine
      └─ r.Run(":" + port)
```

```
routes/router.go
 ├─ Public group (no auth)
 │    ├─ GET /health, /stats
 │    ├─ POST /auth/register, /auth/login, /auth/refresh
 │    ├─ POST /auth/verify-email, /auth/forgot-password, /auth/reset-password
 │    ├─ GET /u/:username, /requests, /requests/:id, /requests/:id/fulfillments
 │    ├─ GET /leaderboard/national, /leaderboard/regional
 │    ├─ GET /events
 │    ├─ GET /passport/verify/:token, /passport/:username
 │    ├─ GET /timeline/:username
 │    ├─ GET /recognition/:username
 │    └─ GET /trust-score/:username
 │
 ├─ Auth group (JWT required)
 │    ├─ GET /donors (search)
 │    ├─ GET/PUT /auth/me
 │    ├─ POST /auth/logout, /auth/resend-verification
 │    └─ PUT /auth/change-password
 │
 ├─ Verified-email group (JWT + email_verified)
 │    ├─ GET/POST /donor-history, PUT /donor-history/:id
 │    ├─ POST /requests, GET /requests/mine
 │    ├─ PUT /requests/:id/status, POST /requests/:id/fulfill
 │    ├─ GET/PUT /donor-status
 │    ├─ GET/POST /donor-verification
 │    ├─ GET /recognition
 │    ├─ GET /timeline
 │    ├─ GET/POST /passport, POST /passport/renew
 │    ├─ GET /trust-score, POST /trust-score/refresh
 │    └─ GET/POST/PUT/DELETE /claims, /claims/:id
 │
 ├─ Admin group (super_admin)
 │    ├─ GET/PUT /admin/users, /admin/users/:id/role
 │    ├─ POST /events
 │    ├─ GET/POST/PUT/DELETE /admin/awards, /admin/awards/:id
 │    └─ POST /admin/titles, GET /admin/titles
 │
 └─ PMI group (super_admin OR pmi_admin)
      ├─ GET /admin/stats
      ├─ GET /admin/claims, /admin/claims/:id
      ├─ PUT /admin/claims/:id/review
      ├─ GET /admin/verifications
      ├─ PUT /admin/verifications/:id/review
      └─ GET /admin/analytics/* (6 endpoints)
```

```
Layered Architecture (per request)

 Handler (HTTP binding)
   └─ Service (business logic)
        └─ Repository (data access)
             └─ sqlx.DB (PostgreSQL)

 Some handlers skip Service layer (donor_history, blood_request
 operate directly on repo from handler)
```

## Handlers (16 files)

| Handler | Key Functions |
|---|---|
| `auth_handler.go` | Register, Login, Refresh, Logout, VerifyEmail, ResendVerification, ForgotPassword, ResetPassword, ChangePassword |
| `user_handler.go` | GetProfile, UpdateProfile, ListAll, UpdateUserRole, GetPublicProfile |
| `donor_history_handler.go` | List, Create, Update |
| `blood_request_handler.go` | Create, ListOpen, GetByID, MyRequests, UpdateStatus, Fulfill, ListFulfillments |
| `search_handler.go` | Search (donors with distance + button_state) |
| `donor_status_handler.go` | GetStatus, UpdateStatus |
| `leaderboard_handler.go` | National, Regional |
| `event_handler.go` | List, Create |
| `passport_handler.go` | GetMyPassport, GetByUsername, VerifyByQR, Request, Renew |
| `claim_handler.go` | ListMy, Get, Create, Update, Cancel, Review (admin), ListPending (admin) |
| `verification_handler.go` | GetMy, Submit, Review (admin), ListPending (admin) |
| `timeline_handler.go` | GetMyTimeline, GetPublicTimeline |
| `recognition_handler.go` | GetPortfolio, GetPublicPortfolio, Award CRUD (admin), Title Award (admin) |
| `admin_handler.go` | GetStats, ListPendingClaims, GetClaimDetail, ListPendingVerifications |
| `trust_handler.go` | GetOwn, GetPublic, Refresh |
| `analytics_handler.go` | ByInstitution, ByCity, ByYear, ByMonth, AgeDistribution, TopDonors |

## Services (6 files)

| Service | Key Functions |
|---|---|
| `auth_service.go` | Register, Login, RefreshToken, Logout, VerifyEmail, ResendVerification, ForgotPassword, ResetPassword, ChangePassword |
| `email_service.go` | Send (HTML via SMTP), SendVerificationEmail, SendPasswordResetEmail |
| `donor_status_service.go` | EvaluateEligibility, UpdateStatus, GetSearchPriority |
| `file_service.go` | Upload (S3/mock), GetPublicURL |
| `trust_service.go` | Calculate (trust breakdown), GetStoredScore |
| `whatsapp_service.go` | GenerateWhatsAppLink, DonorNotificationMessage, RequesterShareMessage |

## Frontend Architecture

```
layout.tsx (Root Layout)
 ├─ AuthProvider (context)
 ├─ DesktopSidebar (md+)
 ├─ main > {children}
 ├─ BottomNav (mobile fixed)
 └─ Toaster (sonner)

Pages (30 page.tsx in 27 routes):
 Public:       /, /login, /register, /forgot-password, /reset-password,
              /verify-email, /privacy, /terms
 Authenticated: /search, /profile, /donor-history
 Requests:     /requests, /requests/new, /requests/share/[id]
 Phase 1:      /passport, /passport/verify/[token], /claims, /claims/new
 Phase 1b:     /verification, /timeline
 Phase 2:      /recognition
 Phase 3-4:    /admin, /admin/analytics, /admin/claims, /admin/verifications,
              /admin/awards
 Events:      /events, /events/new
 Leaderboard: /leaderboard
 Public SSR:  /u/[username], /passport/verify/[token], /privacy, /terms
```

## Auth Flow

```
Registration:
  1. POST /auth/register → { user, access_token, refresh_token }
  2. Store tokens in localStorage
  3. AuthProvider sets user state

Login:
  1. POST /auth/login → { user, access_token, refresh_token }
  2. Same as registration steps 2-3

Token Refresh (automatic in api.ts):
  1. API call returns 401
  2. api.ts POST /auth/refresh with refresh_token
  3. Server validates hash, deletes old, issues new pair (rotation)
  4. Retries original request with new access_token
  5. If refresh fails → redirect to /login
  6. If 403 "email not verified" → redirect to /verify-email

Logout:
  1. POST /auth/logout → deletes all refresh tokens for user
  2. Clears localStorage
  3. Sets user to null
  4. Redirects to /
```

## External Integrations

| Integration | Status | Details |
|---|---|---|
| WhatsApp (wa.me) | Implemented | `whatsapp_service.go` generates wa.me links with pre-filled message templates |
| MinIO / S3 | Implemented | `file_service.go`: S3-compatible driver with mock fallback (returns fake URL if S3 env not set) |
| QR Code (api.qrserver.com) | Implemented | External API used in share card, passport, and recognition pages (no local QR library) |
| Redis | Declared only | In docker-compose.yml + config, but zero usage in code |
| OpenStreetMap + Leaflet | Declared only | Not integrated in any frontend component |
| PMI Integration | Implemented (Phase 3) | PMI review portal — claims, verifications, analytics |
