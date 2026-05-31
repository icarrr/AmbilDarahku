# AI Memory Layer — AmbilDarahku

> Generated: 2026-05-31
> Version: 2.0

---

## 1. CORE SUMMARY

**AmbilDarahku** — Indonesian community blood donor platform. Monorepo: Go/Gin backend + Next.js 16 frontend. JWT auth with refresh rotation, glassmorphism UI ("Vitality Flow"), PostgreSQL 16, Docker Compose (5 services).

**Flow:** Donors register (blood type, location, availability) → Requesters post blood requests by type/urgency/hospital → Donors search by location/blood type/compatibility → Requesters share cards via WhatsApp → Fulfillments create auto-verified donor history.

**Architecture:** Backend layered (handler→service→repository). Frontend `app/` router, shadcn/ui + Base UI, sonner toasts. No tests.

---

## 2. DOMAIN BREAKDOWN

### auth
- Register (17 fields, bcrypt, email/phone uniqueness) → sends verification email (SMTP optional, no-op when `SMTP_HOST` empty)
- Login → JWT pair (15m access + 7d refresh with rotation)
- Email verification via `verification_tokens` table; `email_verified` column; VerifyEmail returns new JWT
- Forgot/reset password via token; change-password requires current password; 1-min rate limit on forgot (in-memory map + mutex)
- Middleware chain: `AuthRequired` (JWT) → `EmailVerifiedRequired` → `AdminRequired` (role check)
- Unverified users restricted: only GET/PUT `/auth/me`, logout, resend-verification, change-password

### donor
- **Profile** — blood_type, rhesus, date_of_birth, gender, weight, height, location (prov/city/district/lat/lng), avatar, username
- **Eligibility engine** (`pkg/eligibility/`) — modular `Rule` interface: `AgeRule` (17-60 first, 65 repeat), `WeightRule` (≥45kg), `DonationIntervalRule` (56 days). Statuses: `eligible | not_eligible | waiting_period | needs_clearance`
- **Availability** — automatic mode syncs with eligibility; manual mode allows override with reason + ready_again_date
- **Donor history** — chronological log with proof photo upload; verification (pending→verified/rejected); duplicate-day guard prevents multiple entries same date
- **Badges** — 6 tiers (Pemula=1, Penolong=5, Pahlawan=10, Guardian=25, Legend=50, Champion=100). Auto-awarded on `RefreshDonationStats`
- **Search priority** — P1=eligible+available, P2=ready≤3d, P3=ready≤7d, P4=other
- **Donor search** — filter by blood_type, rhesus, city, radius (haversine), `compatible_with` (blood compatibility matrix); defaults to `availability_status=available`

### request
- Blood requests: patient_name, hospital, blood_type+rhesus, urgency (critical/urgent/normal), location (lat/lng/city), contact_phone
- **Fulfillment** — `request_fulfillments` table; donor commits bags to a request; auto-creates verified `DonorHistory` with hospital from request; duplicate-date guard
- **Share card** — public page (`/requests/share/[id]`) with patient info, compatible donor types, progress bar, WhatsApp deep link; "Saya Sudah Donor" button disabled when user's blood type incompatible (tooltip shows reason)

### blood compatibility (`pkg/blood/` + `lib/blood-compatibility.ts`)
- Strict ABO+Rh RBC rules: O- universal donor, AB+ universal recipient
- `CanDonateTo(donor, recipient)`, `CanReceiveFrom(recipient)`, `CompatibleDonorsFor(recipient)` (alias), `Parse()`
- Frontend mirrors: `compatibleDonorsFor()`, `canDonateTo()`
- `+` encoding fix: search query string replaces `+`→`%2B` so Gin doesn't decode as space

### admin
- User management: list all, update roles (donor, super_admin, community_admin, pmi_admin, hospital_admin)
- Event management: create community blood drives

### event
- Blood drive events: title, date/time, location, city, quota, status (upcoming/ongoing/completed/cancelled)
- Public listing; admin creation

### leaderboard
- National (top 100 by points) and regional (top 50 by city); no auth required

---

## 3. API MAP

All under `/api/v1`. [P]=public, [A]=auth, [V]=verified(email), [AD]=admin.

### Public
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/stats` | Dashboard stats (active_donors, lives_saved, etc.) |
| POST | `/auth/register` | Register (17 fields) |
| POST | `/auth/login` | Login → JWT pair |
| POST | `/auth/refresh` | Token refresh + rotation |
| POST | `/auth/verify-email` | Verify email via token → new JWT |
| POST | `/auth/forgot-password` | Send reset token (1-min rate limit) |
| POST | `/auth/reset-password` | Reset password via token |
| GET | `/u/:username` | Public profile |
| GET | `/requests` | Open requests (filters: blood_type, rhesus, urgency, limit) |
| GET | `/requests/:id` | Request by ID |
| GET | `/requests/:id/fulfillments` | List fulfillments for request |
| GET | `/donors` | Donor search (blood_type, rhesus, city, radius, lat, lng, compatible_with, availability_status) |
| GET | `/leaderboard/national` | Top 100 by points |
| GET | `/leaderboard/regional` | Top 50 by city |
| GET | `/events` | Upcoming events |

### Authenticated (JWT required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth/me` | Profile + badges |
| PUT | `/auth/me` | Update profile fields |
| POST | `/auth/logout` | Invalidate all refresh tokens |
| POST | `/auth/resend-verification` | Resend verification email |
| PUT | `/auth/change-password` | Change password (requires current_password) |

### Verified (email verified + JWT)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/donor-history` | My donation history |
| POST | `/donor-history` | Add donation record (duplicate-date guard → 409) |
| PUT | `/donor-history/:id` | Upload proof photo |
| POST | `/requests` | Create blood request |
| GET | `/requests/mine` | My requests |
| PUT | `/requests/:id/status` | Update status (open→fulfilled/cancelled) |
| POST | `/requests/:id/fulfill` | Fulfill → fulfillment + auto-verified donor history |
| GET | `/donor-status` | Eligibility status + reasons + availability + priority |
| PUT | `/donor-status` | Update availability mode/status |

### Admin (super_admin)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/users` | List all users |
| PUT | `/admin/users/:id/role` | Change user role |
| POST | `/events` | Create event |

### Search Response — `button_state` on donors
Each donor in search response includes:
- `button_state`: `"enabled"` | `"disabled"`
- `reason_if_disabled`: string (empty when enabled)
- Logic: disabled when `availability_status != "available"` OR `eligibility_status != "eligible"`

---

## 4. DATA MAP

### Tables (9)

**`users`** — 30 cols. PK UUID. Unique: email, phone, username. CHECK: role(5), gender(2), blood_type(4), rhesus(2), availability_mode(2), availability_status(3), eligibility_status(4). Indexes: blood_type, city, eligibility, availability, (lat,lng).

**`donor_histories`** — 14 cols. FK→users CASCADE. Index: user_id. verification_status: pending/verified/rejected. Stats refresh on create: recalculates total_donations, total_points, last_donation_date, eligibility_status (56-day interval → `eligible`/`waiting_period`).

**`blood_requests`** — 16 cols. FK→users CASCADE. Indexes: blood_type, urgency, status. CHECK: blood_type, rhesus, urgency(3), status(3). fulfilled_bags incremented atomically on fulfillment.

**`request_fulfillments`** — 5 cols. FK→blood_requests + users (CASCADE). Donor name resolved via JOIN.

**`badges`** — 5 cols. Name UNIQUE. min_donations: 1,5,10,25,50,100. Seeded idempotent on startup.

**`user_badges`** — 4 cols. FK→users+badges. UNIQUE(user_id, badge_id). Auto-awarded by `RefreshDonationStats`.

**`refresh_tokens`** — 5 cols. FK→users CASCADE. Token SHA-256 hash. Rotation: delete old on each refresh.

**`donor_verifications`** — 9 cols. FK→users CASCADE. Level CHECK (1,2,3). Status: pending/approved/rejected.

**`verification_tokens`** — 7 cols. FK→users CASCADE. Type: email_verification, password_reset. Used_at marks consumed.

**`events`** — 14 cols. Status: upcoming/ongoing/completed/cancelled. Indexes: event_date, status.

### Notes
- Migrations: auto-run idempotent DDL on startup (ALTER TABLE ADD COLUMN IF NOT EXISTS, DROP CONSTRAINT IF EXISTS)
- No soft deletes, no audit logging, no migration versioning

---

## 5. UI MAP

### Pages (Next.js app/ router)
| Route | Auth | Description |
|-------|------|-------------|
| `/` | No | Landing page with stats |
| `/login` | No | Email+password form |
| `/register` | No | 3-step form (profile→blood→domicile) in GlassCard |
| `/forgot-password` | No | Email input → success + admin WhatsApp contact |
| `/reset-password` | No | Token from URL → new password (Suspense boundary) |
| `/verify-email` | No | Token from URL → auto-update stored JWT (Suspense) |
| `/profile` | JWT | Dashboard + status + edit form + timeline + badges |
| `/search` | No* | Donor search with filters + donor cards + "Saya Sudah Donor" button per card |
| `/requests` | No | Open requests list |
| `/requests/new` | JWT | Create request form (blood type hint from compatibility) |
| `/requests/share/[id]` | No | Public share card + "Saya Sudah Donor" (disabled if incompatible) |
| `/donor-history` | JWT | Donation log + add form + proof photo upload |
| `/leaderboard` | No | National/regional tabs |
| `/events` | No | Upcoming events list |
| `/events/new` | Admin | Create event |
| `/admin` | Admin | User management table (role changer) |
| `/u/[username]` | No | Public profile page |
| `/privacy` | No | Privacy policy |
| `/terms` | No | Terms of service |

### Components (21)
- **Navigation:** `navbar.tsx`, `bottom-nav.tsx`, `desktop-sidebar.tsx`
- **Display:** `glass-card.tsx`, `donor-card.tsx`, `stat-card.tsx`, `timeline.tsx`, `section-title.tsx`
- **Badges:** `blood-type-badge.tsx`, `status-badge.tsx`, `urgency-badge.tsx`, `rank-badge.tsx`, `avatar-with-badge.tsx`
- **UI (shadcn/Base UI):** button, card, badge, input, label, select, alert, sonner (toast)

### Key Patterns
- `params` is `Promise<{...}>` (Next.js 16) — unwrapped with `use()` in client components
- `useSearchParams()` requires `<Suspense>` boundary (established pattern in requests/new, reset-password, verify-email, forgot-password)
- Client components use `api.get/post/put` from `@/lib/api.ts` (auto-attaches JWT, handles 401→refresh→retry, 403→redirect verify-email)
- Auth via `useAuth()` context: user, loading, isAdmin, login, register, logout, refreshUser
- `Accept-Encoding: ShockwaveFlash` override still needed for sitemap fetch (compressed response)

---

## 6. INFRA MAP

### Docker Compose (5 services)
| Service | Image | Port | Depends | Health |
|---------|-------|------|---------|--------|
| postgres | postgres:16-alpine | ${DB_PORT}:5432 | — | pg_isready |
| redis | redis:7-alpine | ${REDIS_PORT}:6379 | — | redis-cli ping |
| minio | minio/minio:latest | 9000/9001 | — | curl /minio/health/live |
| backend | Go build→alpine:3.19 | ${SERVER_PORT}:8080 | postgres+redis+minio (healthy) | None |
| frontend | Node 20→standalone | ${FRONTEND_PORT}:3000 | backend | None |

### Build
- Backend: multi-stage (golang:latest builder → alpine:3.19 runner, CGO_ENABLED=0, ~20MB binary)
- Frontend: multi-stage (node:20-alpine builder `npm ci`+`npm run build` → node:20-alpine runner standalone)

### Config
- Required: `DB_*`, `JWT_SECRET`, `APP_URL`, `SERVER_PORT`
- Optional SMTP: `SMTP_*` (verification/password emails)
- Optional storage: `MINIO_*`, `REDIS_*`
- Frontend: `NEXT_PUBLIC_API_URL=/api/v1` (proxied via next.config.ts rewrite)

### Known Issues
- MinIO `GetPublicURL` returns `"TODO"` — file upload broken
- Redis container running but zero usage in code
- No production deployment config (no k8s, terraform, monitoring)
- No HTTPS termination
- `HOSTNAME` env in Docker breaks Next.js standalone (binds to container hostname IP, not `0.0.0.0`)

---

## 7. CHANGE DIGEST

| # | Date | Change | Key Files |
|---|------|--------|-----------|
| 1 | May 31 | **Donor eligibility rule engine** — `pkg/eligibility/` with modular rules (age, weight, interval). 4 statuses: eligible/not_eligible/waiting_period(56d)/needs_clearance(>60). Migrated `recovery`→`waiting_period`. Frontend badges + profile + admin labels handle all 4. | `pkg/eligibility/*`, `donor_status_service.go`, `migrations.go`, `status-badge.tsx`, profile/admin pages |
| 2 | May 31 | **Blood compatibility `+` encoding fix** — `URLSearchParams` doesn't encode `+`; Gin decodes as space. Added `.replace(/\+/g, "%2B")` to search query string. | `search/page.tsx` |
| 3 | May 31 | **Search `button_state`** — Each donor response includes `button_state` (enabled/disabled) + `reason_if_disabled`. "Saya Sudah Donor" button per donor card with tooltip. | `search_handler.go`, `search/page.tsx` |
| 4 | May 31 | **Compatibility guard on share page** — "Saya Sudah Donor" disabled when user blood type incompatible with request; tooltip shows mismatch. | `requests/share/[id]/page.tsx` |
| 5 | May 31 | **Duplicate-day prevention** — `Fulfill` + `POST /donor-history` both check `FindByUserIDAndDate`; return 409 if already recorded today. | `donor_history_repository.go`, `donor_history_handler.go`, `blood_request_handler.go` |
| 6 | May 31 | **Fulfill creates DonorHistory** — `Fulfill` handler now auto-creates verified donor history with hospital/city from request; calls `RefreshDonationStats`. Added `historyRepo`+`userRepo` deps. | `blood_request_handler.go`, `router.go` |
| 7 | May 31 | **Profile edit expanded** — province, district, blood_type, rhesus, date_of_birth, gender fields added to edit form. User type extended in auth-context. | `profile/page.tsx`, `auth-context.tsx`, `user_handler.go` |
| 8 | May 31 | **Blood compatibility hint on request form** — Shows compatible donor types below blood type selection. | `requests/new/page.tsx` |
| 9 | May 31 | **Suspense boundaries** — Wrapped reset-password, verify-email, forgot-password with `<Suspense>` for `useSearchParams`. | reset/verify/forgot-password pages |
| 10 | May 30 | **Email verification system** — `email_verified` column, `verification_tokens` table, `EmailService` (SMTP/no-op), `VerifiedEmailRequired` middleware, verify/resend handlers. | Full auth stack |
| 11 | May 30 | **Password management** — Forgot/reset/change-password with tokens + rate limit. Frontend pages. | `auth_handler.go`, `auth_service.go`, forgot/reset pages |
| 12 | May 30 | **Blood compatibility matrix** — `pkg/blood/compatibility.go` + `lib/blood-compatibility.ts` with full ABO+Rh rules. `compatible_with` search param. Share card shows compatible badges. | `compatibility.go`, `blood-compatibility.ts`, `search_handler.go`, share page |

---

## 8. MISSING AREAS

- **Tests**: Zero across entire project (backend + frontend)
- **Error boundaries**: No `error.tsx` or `loading.tsx` in any route
- **File service**: MinIO `GetPublicURL` returns `"TODO"` — uploads inaccessible
- **Redis**: Container running, config loaded, zero usage in code
- **Production infra**: No k8s, terraform, monitoring, backups, HTTPS
- **Rate limiting**: Only forgot-password (in-memory); no general rate limiter
- **Privacy**: Phone numbers exposed via search API to unauthenticated callers
- **Audit logging**: None
- **Pagination**: None on any list endpoint (donor history, requests, search, admin users)
- **Notifications**: No push/email alert when urgent request matches donor's blood type
- **Donor verification levels**: Schema has level 1-3 but no UI flows reference them
