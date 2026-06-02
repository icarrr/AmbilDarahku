# Features — AmbilDarahku (v3.0)

## User Roles

| Role | Access |
|---|---|
| `donor` (default) | Own profile, donor history, blood requests, search, passport, claims, verification, timeline, recognition |
| `super_admin` | All donor access + admin dashboard, user management, role assignment, events CRUD, awards CRUD, analytics, review claims/verifications |
| `pmi_admin` | PMI review queue: review claims, review verifications, analytics view |
| `community_admin` | Schema-only (no specific routes) |
| `hospital_admin` | Schema-only (no specific routes) |

## Feature Inventory

### Authentication & User Management

| Feature | Status | Source |
|---|---|---|
| Email/password registration (17 fields → 12 fields now) | ✅ Complete | `auth_service.go` |
| Login with JWT | ✅ Complete | `auth_service.go` |
| Token refresh with rotation | ✅ Complete | `auth_service.go`, `api.ts` |
| Logout (invalidate all tokens) | ✅ Complete | `auth_service.go` |
| Get/update own profile | ✅ Complete | `user_handler.go` |
| Admin list all users | ✅ Complete | `user_handler.go` ListAll |
| Admin update user role | ✅ Complete | `user_handler.go` UpdateUserRole |
| Public portfolio by username | ✅ Complete | `user_handler.go` GetPublicProfile (includes national_donor_id, donation_volume, verification_level, trust_score) |
| 3-step registration form | ✅ Complete | `register/page.tsx` |
| Profile editing (name, phone, blood type, domicile, DOB, gender, username, avatar) | ✅ Complete | `profile/page.tsx` |
| Registration without lat/lng | ✅ Complete | `auth_service.go` (lat/lng removed from input; DB default 0) |
| Role defaults to "donor" | ✅ Complete | `auth_service.go` |
| DateOfBirth parsing (RFC3339 + YYYY-MM-DD) | ✅ Complete | `auth_service.go` |

### Email & Password Management

| Feature | Status | Source |
|---|---|---|
| Email verification system | ✅ Complete | `auth_service.go`, `verification_tokens` table |
| SMTP email sending (optional, no-op when not configured) | ✅ Complete | `email_service.go` |
| Email templates (branded HTML with red gradient, droplet SVG, styled button) | ✅ Complete | `email_service.go` |
| SMTP_FROM with SMTP_SENDER fallback | ✅ Complete | `config.go` |
| Forgot password (1-min rate limit) | ✅ Complete | `auth_handler.go` |
| Reset password via token | ✅ Complete | `auth_handler.go` |
| Change password (requires current password) | ✅ Complete | `auth_handler.go` |
| Unverified user restriction (only auth endpoints) | ✅ Complete | `middleware/auth.go` EmailVerifiedRequired |
| Frontend page blocks for unverified users (search, requests, requests/new, requests/share) | ✅ Complete | Multiple page.tsx files |

### Donor Search

| Feature | Status | Source |
|---|---|---|
| Search by blood type | ✅ Complete | `search_handler.go` |
| Search by city | ✅ Complete | `search_handler.go` |
| Search by availability (defaults to available) | ✅ Complete | `search_handler.go` |
| Search by compatible_with (blood compatibility) | ✅ Complete | `search_handler.go` |
| Search by distance (haversine, lat/lng/radius) | ✅ Complete | `search_handler.go` |
| Search priority sorting (P1-P4) | ✅ Complete | `donor_status_service.go` |
| Button state (enabled/disabled) per donor with reason | ✅ Complete | `search_handler.go`, `search/page.tsx` |
| Clickable donor cards → `/u/[username]` | ✅ Complete | `search/page.tsx` |
| WhatsApp contact button per donor | ✅ Complete | `donor-card.tsx` |
| Grid/list view toggle | ✅ Complete | `search/page.tsx` |
| Geolocation (browser) | ✅ Complete | `search/page.tsx` |
| Auth-gated (GET /donors moved to auth group) | ✅ Complete | `router.go` |

### Donor Eligibility Engine

| Feature | Status | Source |
|---|---|---|
| Modular rule system (Rule interface) | ✅ Complete | `pkg/eligibility/` |
| AgeRule: 17-60 first-time, 65 repeat | ✅ Complete | `age_rule.go` |
| WeightRule: minimum 45 kg | ✅ Complete | `weight_rule.go` |
| DonationIntervalRule: minimum 56 days | ✅ Complete | `interval_rule.go` |
| 4 statuses: eligible / waiting_period / not_eligible / needs_clearance | ✅ Complete | `rule.go`, `status-badge.tsx` |
| Availability mode (automatic/manual) | ✅ Complete | `donor_status_service.go` |
| Auto-mode: syncs with eligibility | ✅ Complete | `donor_status_service.go` |
| Manual mode: user sets status + reason + ready_again_date | ✅ Complete | `donor_status_service.go` |
| Search priority (P1-P4) | ✅ Complete | `donor_status_service.go` |
| Dashboard status toggle | ✅ Complete | `profile/page.tsx` |

### Blood Requests

| Feature | Status | Source |
|---|---|---|
| Create emergency blood request | ✅ Complete | `blood_request_handler.go` |
| List open requests (filters: blood_type, urgency, limit) | ✅ Complete | `blood_request_handler.go` |
| Get request by ID | ✅ Complete | `blood_request_handler.go` |
| List my requests | ✅ Complete | `blood_request_handler.go` |
| Update request status (open/fulfilled/cancelled) | ✅ Complete | `blood_request_handler.go` |
| Fulfill request → creates fulfillment + auto-verified donor history + duplicate-date guard | ✅ Complete | `blood_request_handler.go` |
| List fulfillments (with donor names) | ✅ Complete | `blood_request_handler.go` |
| Urgency levels (critical/urgent/normal) | ✅ Complete | Model, UI |
| Sort by urgency then recency | ✅ Complete | `blood_request_repository.go` |
| Request form with blood type compatibility hint | ✅ Complete | `requests/new/page.tsx` |
| Share card (public page with QR via api.qrserver.com, compatibility matrix, progress bar) | ✅ Complete | `requests/share/[id]/page.tsx` |
| WhatsApp contact + template messages | ✅ Complete | `whatsapp_service.go` |
| "Saya Sudah Donor" button with compatibility guard + tooltip | ✅ Complete | `requests/share/[id]/page.tsx` |
| Rhesus hardcoded to "+" in request creation | ✅ Complete | `blood_request_handler.go` |

### Donor History

| Feature | Status | Source |
|---|---|---|
| Add donation record (date, location, institution, bags, notes) | ✅ Complete | `donor_history_handler.go` |
| List own history (chronological) | ✅ Complete | `donor_history_handler.go` |
| Update proof photo (auto-verifies on upload) | ✅ Complete | `donor_history_handler.go` |
| Verification status (pending/verified/rejected) | ✅ Complete | Model, UI |
| Duplicate-day guard (409 if same date) | ✅ Complete | `donor_history_repository.go` |
| Stats refresh on create (total_donations, points, last_donation_date, eligibility) | ✅ Complete | `user_repository.go` RefreshDonationStats |
| Donation volume calculation (0.35L ≤55kg / 0.45L >55kg) | ✅ Complete | `profile/page.tsx` |

### Badge System

| Feature | Status | Source |
|---|---|---|
| 6 badge tiers seeded on startup | ✅ Complete | BadgeRepository.SeedDefaults |
| Auto-award on RefreshDonationStats | ✅ Complete | `user_repository.go` RefreshDonationStats (after any donor history change) |
| Frontend display on profile, portfolio, leaderboard | ✅ Complete | profile, u/[username], leaderboard pages |

| Badge | Donations |
|---|---|
| First Drop | 1 |
| Lifesaver | 5 |
| Hero | 10 |
| Guardian | 25 |
| Legend | 50 |
| Blood Champion | 100 |

### Leaderboard

| Feature | Status | Source |
|---|---|---|
| National (top 100) | ✅ Complete | `leaderboard_handler.go` |
| Regional (top 50, by city parameter) | ✅ Complete | `leaderboard_handler.go` |
| National/regional tab toggle | ✅ Complete | `leaderboard/page.tsx` |
| Gold/silver/bronze podium with animated cards | ✅ Complete | `leaderboard/page.tsx` |
| Ranked list with progress bars | ✅ Complete | `leaderboard/page.tsx` |
| Current user highlight | ✅ Complete | `leaderboard/page.tsx` |

### Events

| Feature | Status | Source |
|---|---|---|
| Event listing (upcoming/ongoing) | ✅ Complete | `event_handler.go`, `events/page.tsx` |
| Create event (admin) | ✅ Complete | `event_handler.go`, `events/new/page.tsx` |
| NGO-themed event card (countdown, progress bar, gradient) | ✅ Complete | `event-card.tsx` |

### Phase 1 — National Donor Passport

| Feature | Status | Source |
|---|---|---|
| `national_donor_id` and `donation_volume_total` on users table | ✅ Complete | Migrations |
| `donor_passports` table (passport number, QR token, activation, renewal) | ✅ Complete | Migrations |
| Passport number format: ADK-YYYY-NNNNNN | ✅ Complete | `passport_handler.go` |
| QR token: 64-char hex | ✅ Complete | `passport_handler.go` |
| Passport API: request, view own, view by username, verify by QR token, renew | ✅ Complete | `passport_handler.go` |
| Public passport QR verification page (SSR) | ✅ Complete | `passport/verify/[token]/page.tsx` |
| Passport page with QR, print, stats, renew | ✅ Complete | `passport/page.tsx` |

### Phase 1 — Historical Donation Claims

| Feature | Status | Source |
|---|---|---|
| `donation_claims` table (pending/approved/rejected workflow) | ✅ Complete | Migrations |
| Claims API: create, list, update (while pending), cancel, admin review | ✅ Complete | `claim_handler.go` |
| Claims frontend: list page + submission form | ✅ Complete | `claims/page.tsx`, `claims/new/page.tsx` |
| Approved claims call RefreshDonationStats | ✅ Complete | `claim_handler.go` ReviewClaim |

### Phase 1b — Verification Framework

| Feature | Status | Source |
|---|---|---|
| `verification_level INT` on users (0/1/2/3) | ✅ Complete | Migrations |
| Verification API: get status, submit request (level + verifier_role), admin review (approve/reject auto-updates user level) | ✅ Complete | `verification_handler.go` |
| Frontend: `/verification` page with level progress, submit form, history | ✅ Complete | `verification/page.tsx` |

### Phase 1b — Unified Timeline

| Feature | Status | Source |
|---|---|---|
| Timeline API: `GET /timeline` (own), `GET /timeline/:username` (public) | ✅ Complete | `timeline_handler.go` |
| UNION query across donor_histories, donation_claims, user_badges | ✅ Complete | `donor_verification_repository.go` |
| Frontend: `/timeline` page with filterable visual feed | ✅ Complete | `timeline/page.tsx` |

### Phase 2 — Award Engine & Recognition

| Feature | Status | Source |
|---|---|---|
| `award_configs` table (name, type, JSON criteria, scope, active) | ✅ Complete | Migrations |
| `user_titles` table (title, source, config_id, description) | ✅ Complete | Migrations |
| AwardConfigRepository: full CRUD + scope-based lookup | ✅ Complete | `award_config_repository.go` |
| UserTitleRepository: create, find by user, list all, delete | ✅ Complete | `user_title_repository.go` |
| Recognition handler: portfolio (own + public) | ✅ Complete | `recognition_handler.go` |
| Award config CRUD (admin) | ✅ Complete | `recognition_handler.go` |
| Title awarding (admin) | ✅ Complete | `recognition_handler.go` |
| Frontend: `/recognition` page (gradient header, stats, titles, badges, QR, print) | ✅ Complete | `recognition/page.tsx` |
| Frontend: `/admin/awards` page (CRUD table + form) | ✅ Complete | `admin/awards/page.tsx` |

### Phase 3 — PMI Review Portal

| Feature | Status | Source |
|---|---|---|
| Admin stats endpoint (counts) | ✅ Complete | `admin_handler.go` |
| Admin claims list with user info | ✅ Complete | `admin_handler.go` |
| Admin claim detail | ✅ Complete | `admin_handler.go` |
| Admin verification list with user info | ✅ Complete | `admin_handler.go` |
| Admin claims review page | ✅ Complete | `admin/claims/page.tsx` |
| Admin verifications review page | ✅ Complete | `admin/verifications/page.tsx` |
| PMIOrAdmin middleware | ✅ Complete | `middleware/auth.go` |

### Phase 4 — Trust Dashboard & Analytics

| Feature | Status | Source |
|---|---|---|
| Trust score algorithm (5 components: donation_count, verification_level, claim_accuracy, profile_complete, account_age) | ✅ Complete | `trust_service.go` |
| Trust score API: get own, get public, refresh | ✅ Complete | `trust_handler.go` |
| Trust score stored on users table | ✅ Complete | Migrations |
| Analytics: donations by institution (top 20) | ✅ Complete | `analytics_handler.go` |
| Analytics: donations by city (top 20) | ✅ Complete | `analytics_handler.go` |
| Analytics: donations by year | ✅ Complete | `analytics_handler.go` |
| Analytics: donations by month (last 12) | ✅ Complete | `analytics_handler.go` |
| Analytics: age distribution (buckets) | ✅ Complete | `analytics_handler.go` |
| Analytics: top 10 donors | ✅ Complete | `analytics_handler.go` |
| Analytics frontend page (bar charts) | ✅ Complete | `admin/analytics/page.tsx` |

### UI Polish

| Feature | Status | Source |
|---|---|---|
| Register page redesign (max-w-lg, inline validation, spinner, mobile-safe, no overflow) | ✅ Complete | `register/page.tsx` |
| Skeleton loading components | ✅ Complete | `ui/skeleton.tsx` |
| Empty states for claims, timeline, search | ✅ Complete | Multiple pages |
| Bottom nav touch targets | ✅ Complete | `bottom-nav.tsx` |
| CSS animations (fade-in, slide-up, pulse) | ✅ Complete | `globals.css` |
| Landing page: all live API data (stats, badges, requests) | ✅ Complete | `page.tsx` |
| Profile page: donation progress ring, motivational banner, data sync from `/auth/me` | ✅ Complete | `profile/page.tsx` |
| Passport, claims, verification, timeline links in bottom-nav | ✅ Complete | `bottom-nav.tsx` |
| Logout redirect → `/` | ✅ Complete | `auth-context.tsx` |

### Infrastructure

| Feature | Status | Source |
|---|---|---|
| Docker Compose (5 services) | ✅ Complete | `docker-compose.yml` |
| Backend Dockerfile (multi-stage golang→alpine) | ✅ Complete | `backend/Dockerfile` |
| Frontend Dockerfile (multi-stage node:20-alpine, standalone) | ✅ Complete | `frontend/Dockerfile` |
| Frontend .dockerignore (excludes node_modules, .next, .git, .env; keeps .env.local) | ✅ Complete | `frontend/.dockerignore` |
| CI pipeline (Go vet + build, npm ci + build) | ✅ Complete | `.github/workflows/ci.yml` |
| Environment config template | ✅ Complete | `.env.example` |
| Seed data: 1,500+ donors, 60 requests, 29 events | ✅ Complete | `seed/dummy.go` |
| Seed runs in background goroutine | ✅ Complete | `main.go` |
| Seed batch INSERTs (transaction + prepared statement) | ✅ Complete | `seed/dummy.go` |
| File upload: S3 driver + mock fallback (fake URL) | ✅ Complete | `file_service.go` |
| GetPublicURL fix (was literal "TODO") | ✅ Complete | `file_service.go` |

## Planned / Not Implemented

- PDF certificate download
- QR check-in for events
- Blood stock monitoring
- Low stock alerts
- Mass WhatsApp campaigns
- Hospital integration (direct API)
- Smart donor matching (AI/ML)
- Donor broadcast to matching donors
- Community leaderboard (sub-city)
- Mobile app (native)
- Push notifications
- Rate limiting middleware (global)
- Audit logging
- Automated tests
