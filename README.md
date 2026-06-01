<div align="center">
  <h1>AmbilDarahku</h1>
  <p><strong>Temukan Donor Darah <span style="color:#dc2626">Lebih Cepat</span></strong></p>
  <p>Platform donor darah berbasis komunitas. Bangun jaringan donor darah, cari donor terdekat, dan selamatkan nyawa.</p>
</div>

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | Next.js 16, TypeScript, TailwindCSS, shadcn/ui (Base UI) |
| **Backend** | Go 1.22, Gin Framework |
| **Database** | PostgreSQL 16 |
| **Cache** | Redis 7 |
| **Storage** | MinIO / S3 Compatible (Cloudflare R2, AWS S3) |
| **Maps** | OpenStreetMap + Leaflet |
| **Infrastructure** | Docker, Docker Compose |

## Project Structure

```
ambildarahku/
├── backend/
│   ├── cmd/server/main.go              # Entry point
│   ├── internal/
│   │   ├── config/                     # Environment config
│   │   ├── database/                   # PostgreSQL connection & migrations
│   │   ├── handlers/                   # HTTP handlers
│   │   │   ├── auth_handler.go         # Register, login, verify, reset, etc.
│   │   │   ├── user_handler.go
│   │   │   ├── donor_history_handler.go
│   │   │   ├── donor_status_handler.go
│   │   │   ├── blood_request_handler.go
│   │   │   ├── search_handler.go
│   │   │   ├── leaderboard_handler.go
│   │   │   ├── event_handler.go
│   │   │   └── admin_handler.go
│   │   ├── middleware/                 # CORS, JWT auth, email-verified check
│   │   ├── models/                     # Database models
│   │   ├── repositories/              # Data access layer
│   │   ├── routes/                     # Router setup
│   │   └── services/                   # Business logic
│   │       ├── auth_service.go
│   │       ├── donor_status_service.go
│   │       ├── email_service.go
│   │       ├── file_service.go
│   │       └── whatsapp_service.go
│   ├── pkg/
│   │   ├── blood/                      # Blood compatibility matrix
│   │   │   └── compatibility.go
│   │   ├── eligibility/               # Modular eligibility rules
│   │   │   ├── rule.go                # Rule interface
│   │   │   ├── age_rule.go
│   │   │   ├── weight_rule.go
│   │   │   └── interval_rule.go
│   │   └── utils/                      # JWT, password hashing
│   ├── Dockerfile
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── app/                        # Next.js App Router pages
│   │   │   ├── page.tsx               # Landing page with stats
│   │   │   ├── login/
│   │   │   ├── register/              # 3-step form (profile→blood→domicile)
│   │   │   ├── forgot-password/
│   │   │   ├── reset-password/
│   │   │   ├── verify-email/
│   │   │   ├── profile/               # Dashboard, edit, timeline, badges
│   │   │   ├── search/                # Donor search with filters
│   │   │   ├── requests/
│   │   │   │   ├── new/               # Emergency blood request form
│   │   │   │   └── share/[id]/        # Public share card + fulfill
│   │   │   ├── donor-history/         # Donation log + proof upload
│   │   │   ├── leaderboard/           # National/regional rankings
│   │   │   ├── events/
│   │   │   │   ├── page.tsx           # Upcoming events
│   │   │   │   └── new/               # Admin create event
│   │   │   ├── admin/                 # User management
│   │   │   ├── u/[username]/          # Public portfolio page
│   │   │   ├── privacy/
│   │   │   └── terms/
│   │   ├── components/
│   │   │   ├── navbar.tsx
│   │   │   ├── glass-card.tsx
│   │   │   ├── donor-card.tsx
│   │   │   ├── status-badge.tsx
│   │   │   ├── blood-type-badge.tsx
│   │   │   ├── urgency-badge.tsx
│   │   │   ├── timeline.tsx
│   │   │   └── ui/                    # shadcn/ui components
│   │   └── lib/
│   │       ├── api.ts                 # API client with JWT refresh & retry
│   │       ├── auth-context.tsx       # Auth context provider
│   │       ├── blood-compatibility.ts # Frontend blood compatibility
│   │       └── utils.ts
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .github/workflows/ci.yml
└── .env.example
```

## Quick Start

### Prerequisites

- Docker & Docker Compose

### Run Everything

```bash
cp .env.example .env          # Edit JWT_SECRET, SMTP_* for production
docker compose up --build
```

This starts all services:

| Service | URL |
|---|---|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:8080 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |
| MinIO Console | http://localhost:9001 |

Migrations run automatically on backend startup.

### Development (hot reload)

```bash
docker compose up -d postgres redis minio   # infra only
cd backend && go run ./cmd/server           # API on :8080
cd frontend && npm run dev                  # UI on :3000
```

## API Endpoints

### Public

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Health check |
| `GET` | `/api/v1/stats` | Dashboard statistics |
| `POST` | `/api/v1/auth/register` | Register new donor (17 fields) |
| `POST` | `/api/v1/auth/login` | Login → JWT pair |
| `POST` | `/api/v1/auth/refresh` | Refresh access token + rotation |
| `POST` | `/api/v1/auth/verify-email` | Verify email via token → new JWT |
| `POST` | `/api/v1/auth/forgot-password` | Send reset token (1-min rate limit) |
| `POST` | `/api/v1/auth/reset-password` | Reset password via token |
| `GET` | `/api/v1/u/:username` | Public donor portfolio |
| `GET` | `/api/v1/donors` | Search donors (blood_type, rhesus, city, radius, compatible_with) |
| `GET` | `/api/v1/requests` | List open blood requests |
| `GET` | `/api/v1/requests/:id` | Blood request detail |
| `GET` | `/api/v1/requests/:id/fulfillments` | List fulfillments for a request |
| `GET` | `/api/v1/leaderboard/national` | National leaderboard (top 100) |
| `GET` | `/api/v1/leaderboard/regional` | Regional leaderboard (top 50, query: city) |
| `GET` | `/api/v1/events` | List upcoming events |

### Authenticated (JWT required)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/auth/me` | Get own profile + badges |
| `PUT` | `/api/v1/auth/me` | Update profile (blood type, domicile, etc.) |
| `POST` | `/api/v1/auth/logout` | Logout (invalidate all refresh tokens) |
| `POST` | `/api/v1/auth/resend-verification` | Resend verification email |
| `PUT` | `/api/v1/auth/change-password` | Change password (requires current_password) |

### Verified Email Required

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/donor-history` | List my donation history |
| `POST` | `/api/v1/donor-history` | Add donation record (duplicate-date guard → 409) |
| `PUT` | `/api/v1/donor-history/:id` | Upload proof photo |
| `POST` | `/api/v1/requests` | Create blood request |
| `GET` | `/api/v1/requests/mine` | List my requests |
| `PUT` | `/api/v1/requests/:id/status` | Update request status (open/fulfilled/cancelled) |
| `POST` | `/api/v1/requests/:id/fulfill` | Fulfill request (creates fulfillment + auto-verified donor history) |
| `GET` | `/api/v1/donor-status` | Get eligibility status + reasons + availability |
| `PUT` | `/api/v1/donor-status` | Update availability mode/status |

### Admin Only

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/admin/users` | List all users |
| `PUT` | `/api/v1/admin/users/:id/role` | Change user role |
| `POST` | `/api/v1/events` | Create blood drive event |

## Features

### Authentication & Security
- Register with 17 fields (personal info, blood type, location)
- Login with email/password
- JWT pair with refresh token rotation (15m access + 7d refresh)
- **Email verification** — optional SMTP; unverified users restricted to auth endpoints
- **Password management** — forgot/reset via token, change password with current password
- **Rate limiting** — 1-min cooldown on forgot-password (in-memory)

### Blood Compatibility Matrix
- Strict ABO + Rh rules: **O- universal donor, AB+ universal recipient**
- Search by `compatible_with` param instead of specific blood type
- Share cards display compatible donor types as badges
- Donor profile shows who can receive from / donate to them
- `+` encoding fix ensures rhesus-positive blood types work in search URLs

### Donor Eligibility Engine
- Modular rule system in `pkg/eligibility/`:
  - **AgeRule**: 17-60 (first-time donor), up to 65 (repeat donor, needs clearance)
  - **WeightRule**: minimum 45 kg
  - **DonationIntervalRule**: 56-day interval between donations
- Eligibility statuses: `eligible`, `not_eligible`, `waiting_period`, `needs_clearance`
- Availability: auto mode (follows eligibility) or manual mode with reason + ready_again_date
- Search priority: P1 (eligible+available) → P4 (other)

### Donor Search
- Filter by blood type, rhesus, city, radius (haversine), compatible_with
- Results sorted by priority, distance, total donations
- **Button state** per donor card — "Saya Sudah Donor" enabled/disabled with tooltip reason
- Results include `availability_status` and `eligibility_status`

### Emergency Blood Request
- Create request with patient info, hospital, blood type, urgency (normal/urgent/critical)
- Blood type hint shows compatible donors for the selected type
- Share card at `/requests/share/[id]` — public page with WhatsApp deep link
- **"Saya Sudah Donor"** button on share page with blood type compatibility guard + tooltip
- **Fulfill** creates a verified donor history entry with hospital info, duplicate-date guard

### Donor History
- Record donation date, location, institution, bags
- Upload proof (photo, card, letter)
- Verification status: pending/verified/rejected
- **Duplicate-day guard** — 409 if already recorded on the same date
- Stats refresh on each new entry (total_donations, points, last_donation_date, eligibility)

### Badge System

| Badge | Donations |
|---|---|
| First Drop | 1 |
| Lifesaver | 5 |
| Hero | 10 |
| Guardian | 25 |
| Legend | 50 |
| Blood Champion | 100 |

### Leaderboard
- National (top 100) and regional (top 50 by city)
- Points formula: `(Donations × 100) + (Verified × 50) + Consistency Bonus`

### Public Portfolio
- Shareable URL at `/u/{username}`
- Shows badge, total donations, blood type, city

### Events
- Blood drive events with date/time, location, city, quota
- Status: upcoming/ongoing/completed/cancelled
- Admin creates; public lists upcoming

### Admin
- User management (list, change roles)
- Role options: donor, super_admin, community_admin, pmi_admin, hospital_admin

## Configuration

Key environment variables (see `.env.example`):

| Variable | Default | Description |
|---|---|---|
| `SERVER_PORT` | 8080 | API server port |
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_NAME` | ambildarahku | Database name |
| `JWT_SECRET` | — | JWT signing secret |
| `JWT_ACCESS_EXPIRY` | 15m | Access token TTL |
| `JWT_REFRESH_EXPIRY` | 7d | Refresh token TTL |
| `S3_ENDPOINT` | localhost:9000 | MinIO/S3 endpoint |
| `S3_BUCKET` | ambildarahku | Storage bucket |
| `SMTP_HOST` | — | SMTP server (email verification, empty = no-op) |
| `SMTP_PORT` | 587 | SMTP port |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASS` | — | SMTP password |
| `APP_URL` | http://localhost:3000 | Frontend URL (for email links) |

## License

© 2025 Faizar Septiawan. All rights reserved.
