# Architecture Decisions — AmbilDarahku

## Technology Decisions

### Go + Gin for Backend

- **Decision**: Go 1.26 with Gin Framework 1.12
- **Context**: Backend was designed before Go 1.26 was release-stable (go.mod says `go 1.26.1`, which may cause issues with Go 1.22 toolchain expected by CI)
- **Reasoning**: Go provides good performance for API workloads; Gin is a mature, well-documented framework
- **Trade-off**: CI uses `actions/setup-go@v5` with `go-version: "1.22"` — may be incompatible with go.mod requiring 1.26

### Next.js 16 + Base UI (shadcn/ui)

- **Decision**: Next.js 16 with App Router + Base UI React components
- **Context**: Frontend uses the very latest Next.js (16.2.6) which has API breaking changes
- **Reasoning**: Modern React patterns; SSR for public pages
- **Trade-off**: Very new versions may have undocumented issues. `frontend/AGENTS.md` warns AI agents to check `node_modules/next/dist/docs/`

### PostgreSQL via sqlx

- **Decision**: Direct SQL with sqlx (no ORM)
- **Context**: Manual SQL queries with named parameter rebinding
- **Reasoning**: Full control over queries; good performance
- **Trade-off**: More boilerplate; risk of SQL injection if not careful (uses parameterized queries)

### JWT with Token Rotation

- **Decision**: Access + refresh token pair with refresh rotation
- **Context**: Refresh token is invalidated and replaced on each use
- **Reasoning**: Limits damage if refresh token is stolen; each use creates a new one
- **Trade-off**: If refresh and original request arrive concurrently, one will fail

## Infrastructure Decisions

### Docker Compose Only (No K8s)

- **Decision**: Local development only with Docker Compose
- **Context**: No production deployment configuration exists
- **Reasoning**: MVP phase; K8s mentioned as future in PRD
- **Trade-off**: No scaling; no production readiness

### MinIO for Dev / S3 for Prod

- **Decision**: MinIO locally, S3-compatible (Cloudflare R2, AWS S3) in production
- **Context**: Same S3 API, just change endpoint config
- **Reasoning**: Avoids cloud costs during development
- **Trade-off**: MinIO-specific features may differ from cloud S3

### Single Docker Compose Network

- **Decision**: All services on one Docker network with service name resolution
- **Context**: Backend uses `postgres` as DB host, `redis` as Redis host in Docker
- **Reasoning**: Simplifies local development
- **Trade-off**: Not suitable for distributed deployment

## Security Decisions

### bcrypt for Password Hashing

- **Decision**: `golang.org/x/crypto/bcrypt` with DefaultCost
- **Context**: Standard Go password hashing
- **Reasoning**: bcrypt is well-tested, includes salt, configurable cost
- **Trade-off**: Slower than argon2 but more widely compatible

### CORS Allow All

- **Decision**: `Access-Control-Allow-Origin: *`
- **Context**: Accepting requests from any origin
- **Reasoning**: Simplifies development
- **Trade-off**: Security risk for production; should be restricted

### Phone Number Exposure

- **Decision**: Phone numbers returned in search results
- **Context**: Search results include the full user model (including phone)
- **Reasoning**: WhatsApp communication requires phone number
- **Trade-off**: Conflicts with PRD privacy requirement (phone should not be public)

## Database Decisions

### UUID Primary Keys

- **Decision**: UUID v4 for all primary keys
- **Context**: Generated via `uuid_generate_v4()` from `uuid-ossp`
- **Reasoning**: Prevents ID enumeration; good for distributed systems
- **Trade-off**: Larger index size than auto-increment integers

### No Migration Tool

- **Decision**: SQL executed directly at startup via `database.RunMigrations()`
- **Context**: Uses `CREATE TABLE IF NOT EXISTS` — idempotent but not versioned
- **Reasoning**: Simplicity for MVP
- **Trade-off**: No rollback support; no migration versioning; schema changes require manual handling

### Soft Deletes Not Implemented

- **Decision**: No `deleted_at` columns
- **Context**: Data is permanently deleted on CASCADE
- **Reasoning**: Simplicity for MVP
- **Trade-off**: Data loss risk; no audit trail

## Missing Decisions (Not Yet Made)

- Rate limiting strategy
- Monitoring/alerting approach
- Backup/restore strategy
- Production deployment target (cloud provider)
- Domain name and SSL certificate management
- Email service integration
