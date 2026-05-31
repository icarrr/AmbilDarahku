# Infrastructure — AmbilDarahku

## Infrastructure Overview

Local-only Docker Compose setup. No production infrastructure configs exist (no Kubernetes, no Terraform, no cloud deployment).

## Docker Compose Services

File: `docker-compose.yml`

| Service | Image | Port(s) | Depends On | Health Check |
|---|---|---|---|---|
| `postgres` | postgres:16-alpine | ${DB_PORT}:5432 | — | pg_isready |
| `redis` | redis:7-alpine | ${REDIS_PORT}:6379 | — | redis-cli ping |
| `minio` | minio/minio:latest | 9000, 9001 | — | curl /minio/health/live |
| `backend` | Build from `./backend/Dockerfile` | ${SERVER_PORT}:8080 | postgres, redis, minio (healthy) | — |
| `frontend` | Build from `./frontend/Dockerfile` | 3000:3000 | backend | — |

### Docker Compose Environment Overrides

During Docker Compose deployment, the backend gets environment overrides:
- `DB_HOST=postgres`, `REDIS_HOST=redis`, `S3_ENDPOINT=minio:9000`, `S3_USE_SSL=false`

## Dockerfiles

### Backend (`backend/Dockerfile`)

Multi-stage build:
1. **Builder**: `golang:latest` → `go mod download` → `CGO_ENABLED=0 go build -o /server ./cmd/server`
2. **Runner**: `alpine:3.19` → copy binary → `CMD ["/server"]`

Exposes port 8080.

### Frontend (`frontend/Dockerfile`)

Multi-stage build:
1. **Builder**: `node:20-alpine` → `npm ci` → `npm run build`
2. **Runner**: `node:20-alpine` → standalone Next.js output → `CMD ["node", "server.js"]`

Uses `next.config.ts` with `output: "standalone"`.

## CI/CD

File: `.github/workflows/ci.yml`

Trigger: Push or PR to `main` branch.

### Backend job
- Runs on `ubuntu-latest`
- Services: PostgreSQL 16 (with health check)
- Steps: `setup-go@v5` (Go 1.22), `go mod tidy`, `go vet ./...`, `go build ./...`

### Frontend job
- Runs on `ubuntu-latest`
- Steps: `setup-node@v4` (Node 22), `npm ci`, `npm run build`

## Volumes

| Volume | Mount | Purpose |
|---|---|---|
| `postgres_data` | /var/lib/postgresql/data | Persistent DB storage |
| `redis_data` | /data | Persistent cache |
| `minio_data` | /data | Persistent file storage |

## Networking

- Services communicate over Docker's internal network
- Ports exposed to host: 3000 (frontend), 8080 (backend), 5432 (postgres), 6379 (redis), 9000/9001 (minio)
- CORS: Allow all origins (`Access-Control-Allow-Origin: *`)

## Secrets Management

- `.env` file (gitignored) contains sensitive config
- `.env.example` provided as template (git-tracked)
- **Security note**: `JWT_SECRET=change-me-in-production` must be changed
- Admin seed credentials are optional env vars (`SEED_ADMIN_EMAIL`, etc.)
- MinIO credentials default to `minioadmin`/`minioadmin`

## Current Limitations

- **No production deployment** — No cloud configs, no domain, no HTTPS
- **No monitoring** — No Prometheus, Grafana, or logging aggregation
- **No backups** — No backup strategy for PostgreSQL, MinIO, or Redis
- **No orchestration** — Kubernetes mentioned as future in PRD, not implemented
- **Redis unused** — In docker-compose and config but no code integration
- **File service incomplete** — `GetPublicURL` returns "TODO"

## Port Reference (local)

| Port | Service |
|---|---|
| 3000 | Frontend (Next.js) |
| 8080 | Backend API (Gin) |
| 5432 | PostgreSQL |
| 6379 | Redis |
| 9000 | MinIO (S3 API) |
| 9001 | MinIO Console |
