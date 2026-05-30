<div align="center">
  <div style="width:80px;height:80px;border-radius:50%;background:#dc2626;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
    <span style="color:white;font-size:32px;font-weight:bold">AD</span>
  </div>
  <h1>AmbilDarahku</h1>
  <p>Platform donor darah berbasis komunitas</p>
  <p>Temukan pendonor darah terdekat dengan cepat, tepat, dan terverifikasi.</p>
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
│   ├── cmd/server/main.go          # Entry point
│   ├── internal/
│   │   ├── config/                 # Environment config
│   │   ├── database/               # PostgreSQL connection & migrations
│   │   ├── handlers/               # HTTP handlers
│   │   │   ├── auth_handler.go
│   │   │   ├── user_handler.go
│   │   │   ├── donor_history_handler.go
│   │   │   ├── donor_status_handler.go
│   │   │   ├── blood_request_handler.go
│   │   │   ├── search_handler.go
│   │   │   └── leaderboard_handler.go
│   │   ├── middleware/             # CORS, JWT auth
│   │   ├── models/                 # Database models
│   │   ├── repositories/           # Data access layer
│   │   ├── routes/                 # Router setup
│   │   └── services/               # Business logic
│   │       ├── auth_service.go
│   │       ├── donor_status_service.go
│   │       ├── file_service.go
│   │       └── whatsapp_service.go
│   ├── pkg/utils/                  # JWT, password hashing
│   ├── migrations/                 # SQL migrations
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js App Router pages
│   │   │   ├── page.tsx            # Landing page
│   │   │   ├── login/              # Login page
│   │   │   ├── register/           # Registration (3-step form)
│   │   │   ├── profile/            # Donor profile & status management
│   │   │   ├── search/             # Donor search with filters
│   │   │   ├── requests/new/       # Emergency blood request form
│   │   │   ├── donor-history/      # Donation history
│   │   │   ├── leaderboard/        # National/regional rankings
│   │   │   └── [username]/         # Public portfolio page
│   │   ├── components/
│   │   │   ├── navbar.tsx
│   │   │   └── ui/                 # shadcn/ui components
│   │   └── lib/
│   │       ├── api.ts              # API client with JWT refresh
│   │       ├── auth-context.tsx    # Auth context provider
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
cp .env.example .env          # Edit JWT_SECRET for production
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
| `POST` | `/api/v1/auth/register` | Register new donor |
| `POST` | `/api/v1/auth/login` | Login |
| `POST` | `/api/v1/auth/refresh` | Refresh access token |
| `GET` | `/api/v1/u/:username` | Public donor portfolio |
| `GET` | `/api/v1/donors` | Search donors (filters: blood_type, rhesus, city) |
| `GET` | `/api/v1/requests` | List open blood requests |
| `GET` | `/api/v1/leaderboard/national` | National leaderboard |
| `GET` | `/api/v1/leaderboard/regional` | Regional leaderboard (query: city) |

### Authenticated

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/auth/me` | Get own profile |
| `PUT` | `/api/v1/auth/me` | Update profile |
| `POST` | `/api/v1/auth/logout` | Logout |
| `GET` | `/api/v1/donor-history` | List donor history |
| `POST` | `/api/v1/donor-history` | Add donor history |
| `POST` | `/api/v1/requests` | Create blood request |
| `GET` | `/api/v1/requests/mine` | List own requests |
| `PUT` | `/api/v1/requests/:id/status` | Update request status |
| `GET` | `/api/v1/donor-status` | Get donor eligibility/availability |
| `PUT` | `/api/v1/donor-status` | Update availability status |

## MVP Features

### User Registration
- Register with basic info, donor info (blood type, rhesus, weight, height), and location
- Login with email/password
- JWT authentication with refresh token rotation

### Donor Profile
- View and edit profile
- Donation statistics (total donations, last donation date)
- Badge display
- Search priority display

### Donor Status Management
- **Eligibility**: Auto-calculated (90-day rule) — Eligible or Recovery
- **Availability**: Auto mode (follows eligibility) or Manual mode
- **Ready-Again Date**: Required when temporarily unavailable
- **Search Priority**: P1 (Eligible + Available) → P4 (Recovery)

### Donor Search
- Filter by blood type, rhesus, city, availability
- Results sorted by priority, distance, donations

### Emergency Blood Request
- Create request with patient info, hospital, blood type, urgency
- WhatsApp-based communication (wa.me links with auto templates)

### Donor History
- Record donation date, location, institution, bags
- Upload proof (photo, card, letter)
- Verification status (pending/verified/rejected)

### Badge System
| Badge | Threshold |
|---|---|
| First Drop | 1 donation |
| Lifesaver | 5 donations |
| Hero | 10 donations |
| Guardian | 25 donations |
| Legend | 50 donations |
| Blood Champion | 100 donations |

### Leaderboard
- National and regional rankings
- Points formula: `(Donations × 100) + (Verified × 50) + Consistency Bonus`

### Public Portfolio
- Shareable URL at `/u/{username}`
- Shows badge, total donations, blood type, city (no WhatsApp exposure)

## Configuration

Key environment variables (see `.env.example`):

| Variable | Default | Description |
|---|---|---|
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_PORT` | 5432 | PostgreSQL port |
| `JWT_SECRET` | - | JWT signing secret |
| `JWT_ACCESS_EXPIRY` | 15m | Access token TTL |
| `JWT_REFRESH_EXPIRY` | 7d | Refresh token TTL |
| `S3_ENDPOINT` | localhost:9000 | MinIO/S3 endpoint |
| `S3_BUCKET` | ambildarahku | Storage bucket |
| `SERVER_PORT` | 8080 | API server port |

## License

© 2025 Faizar Septiawan. All rights reserved.
