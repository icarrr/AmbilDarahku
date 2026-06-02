# Infrastructure — AmbilDarahku

## Overview

Local-only Docker Compose setup. No production infrastructure configs (no k8s, Terraform, cloud deployment, monitoring, backups).

## Docker Compose Services

File: `docker-compose.yml`

| Service | Image | Port(s) | Depends On | Health Check |
|---|---|---|---|---|
| `postgres` | postgres:16-alpine | ${DB_PORT}:5432 | — | pg_isready |
| `redis` | redis:7-alpine | ${REDIS_PORT}:6379 | — | redis-cli ping |
| `minio` | minio/minio:latest | 9000, 9001 | — | curl /minio/health/live |
| `backend` | Build `./backend/Dockerfile` | ${SERVER_PORT}:8080 | postgres, redis, minio (healthy) | None |
| `frontend` | Build `./frontend/Dockerfile` | 3000:3000 | backend | None |

### Docker Compose Env Overrides

- `DB_HOST=postgres`, `REDIS_HOST=redis`, `S3_ENDPOINT=minio:9000`, `S3_USE_SSL=false`
- Frontend `BACKEND_URL=http://backend:8080` (for API proxy rewrite)

## Dockerfiles

### Backend (`backend/Dockerfile`)

Multi-stage:
1. **Builder**: `golang:latest` → `go mod download` → `CGO_ENABLED=0 go build -o /server ./cmd/server`
2. **Runner**: `alpine:3.19` → copy binary → expose 8080 → `CMD ["/server"]`

### Frontend (`frontend/Dockerfile`)

Multi-stage:
1. **Builder**: `node:20-alpine` → `npm ci` → `npm run build`
2. **Runner**: `node:20-alpine` → standalone Next.js → `CMD ["node", "server.js"]`

### Frontend `.dockerignore`

Excludes: `node_modules`, `.next`, `.git`, `.env` (keeps `.env.local` so `NEXT_PUBLIC_API_URL` is read at build time)

## Next.js Config (`next.config.ts`)

- `output: "standalone"` — self-contained build for Docker
- API proxy: all `/api/v1/*` → `BACKEND_URL` (default: `http://backend:8080`)

## CI/CD

File: `.github/workflows/ci.yml`

Trigger: Push or PR to `main`.

### Backend job
- OS: `ubuntu-latest`
- Services: PostgreSQL 16 (with health check)
- Steps: `setup-go@v5` (Go 1.26), `go mod tidy`, `go vet ./...`, `go build ./...`

### Frontend job
- OS: `ubuntu-latest`
- Steps: `setup-node@v4` (Node 22), `npm ci`, `npm run build`
- Uses `working-directory: frontend` per step (not `defaults.run`)

## Volumes

| Volume | Mount | Purpose |
|---|---|---|
| `postgres_data` | /var/lib/postgresql/data | Persistent DB |
| `redis_data` | /data | Persistent cache |
| `minio_data` | /data | Persistent file storage |

## Port Reference (local)

| Port | Service |
|---|---|
| 3000 | Frontend |
| 8080 | Backend API |
| 5432 | PostgreSQL |
| 6379 | Redis |
| 9000 | MinIO (S3 API) |
| 9001 | MinIO Console |

## Current Limitations

- No production deployment (no cloud, domain, HTTPS)
- No monitoring (no Prometheus, Grafana, logging)
- No backups (no DB/volume backup strategy)
- No orchestration (k8s planned, not done)
- Redis unused (container running, zero code integration)
- File upload mock (returns fake URL; no actual file stored unless S3 env vars set)
- CORS allows all origins (should be restricted in production)
- No rate limiting (except forgot-password)
