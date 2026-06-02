# Architecture Decisions — AmbilDarahku

## Technology Decisions

### Go + Gin for Backend
- **Decision**: Go 1.26 with Gin Framework 1.12
- **Trade-off**: go.mod requires 1.26; CI must use matching Go version (now fixed to 1.26)

### Next.js 16 + Base UI (shadcn/ui)
- **Decision**: Next.js 16.2.6 with App Router + Base UI React components (NOT Radix)
- **Trade-off**: Very new Next.js version — `params` is Promise (use `use()`), `useSearchParams()` needs Suspense

### PostgreSQL via sqlx
- **Decision**: Direct SQL with sqlx (no ORM)
- **Trade-off**: More boilerplate; risk of SQL injection if not careful (uses parameterized queries)

### JWT with Token Rotation
- **Decision**: Access (15m) + refresh (7d) pair with rotation
- **Trade-off**: Concurrent requests may cause one to fail if both try to refresh simultaneously

### Rhesus Excluded from UI
- **Decision**: Rhesus removed from all frontend UI components and API inputs; backend defaults to "+"
- **Context**: Indonesian users often don't know their rhesus; DB column remains NOT NULL
- **Trade-off**: Users with negative rhesus type can't specify it; backend always stores "+"

### Registration Without Lat/Lng
- **Decision**: latitude/longitude removed from registration input; DB defaults to 0
- **Context**: PRD specified geolocation but it's impractical for MVP mobile users
- **Trade-off**: City-based search works; radius search requires geocoding later

## Phase 1-4 Decisions

### Passport QR as URL Path (not JWT)
- **Decision**: QR token is 64-char hex embedded in URL path (`/passport/verify/:token`)
- **Reasoning**: Stateless, publicly cacheable, no JWT expiry issues
- **Trade-off**: Token is long (64 chars); but it's embedded in QR code not typed by humans

### Claims Don't Auto-Create DonorHistory
- **Decision**: Approved claims do NOT auto-create donor_history records
- **Reasoning**: Prevents duplicate records; manual reconciliation by PMI
- **Trade-off**: Approved claim stats are reflected in total_donations via RefreshDonationStats but no individual history entry created

### Verification Levels Auto-Update
- **Decision**: Approving a verification request auto-updates the user's `verification_level`
- **Reasoning**: Don't need separate "publish" step
- **Trade-off**: No rollback; rejecting doesn't auto-decrement

### Timeline as UNION Query
- **Decision**: Timeline uses SQL UNION ALL across 3 tables (donor_histories, donation_claims, user_badges)
- **Reasoning**: No pre-materialized timeline; always current
- **Trade-off**: Performance degrades with large datasets; no pagination optimization

### Trust Score Calculated On-The-Fly
- **Decision**: Trust score is computed on-demand (GET /trust-score) and stored to users.trust_score
- **Reasoning**: Reflects current data; stored value for fast reads
- **Trade-off**: Must remember to refresh after state changes (claims, verification, history)

### Analytics Computed On-The-Fly
- **Decision**: All analytics endpoints aggregate via SQL at request time (no pre-aggregation tables)
- **Reasoning**: Simplicity; data volume is low
- **Trade-off**: Expensive queries with large datasets; no caching

## Seed Data Decisions

### Background Goroutine
- **Decision**: Seed runs in `go seed.SeedDummy(db)` so HTTP server starts immediately
- **Reasoning**: Seed takes ~20 minutes for 1,500+ donors with histories
- **Trade-off**: API returns empty data until seed completes

### Batch INSERTs
- **Decision**: History/badge creation uses SQL transaction with prepared statement
- **Fallback**: Individual inserts if transaction fails
- **Reasoning**: Dramatically faster than individual inserts

### Unique Email/Username
- **Decision**: Use monotonic `globalEmailCounter` (1-2300) for both emails and usernames
- **Reasoning**: Avoids duplicates from per-city counter reset

### Default Password
- **Decision**: All seed accounts use `donor123`
- **Reasoning**: Simplifies manual testing; not security-sensitive (dev only)

## Infrastructure Decisions

### Docker Compose Only (No K8s)
- **Context**: MVP phase; no production deployment config exists
- **Trade-off**: No scaling, no production readiness

### MinIO for Dev / S3 Mock Fallback
- **Decision**: S3-compatible driver; if env vars not set, returns fake URL (no file saved)
- **Reasoning**: Avoids requiring MinIO for simple local development

### Single Docker Compose Network
- **Decision**: All services on one Docker network with service name resolution
- **Trade-off**: Not suitable for distributed deployment

## Security Decisions

### bcrypt for Password Hashing
- **Decision**: `golang.org/x/crypto/bcrypt` with DefaultCost
- **Trade-off**: Slower than argon2 but more widely compatible

### CORS Allow All
- **Decision**: `Access-Control-Allow-Origin: *`
- **Trade-off**: Security risk for production; should be restricted

### Phone Number Exposure
- **Decision**: Search results include phone numbers, but endpoint is now auth-gated (JWT required)
- **Trade-off**: Phone still visible to all authenticated users

## Database Decisions

### UUID Primary Keys
- **Decision**: UUID v4 for all tables
- **Trade-off**: Larger index size vs auto-increment integers

### No Migration Tool
- **Decision**: SQL executed at startup via `database.RunMigrations()` — idempotent `CREATE TABLE IF NOT EXISTS`
- **Trade-off**: No rollback, no versioning; schema changes stacked as ALTER TABLE

### No Soft Deletes
- **Decision**: No `deleted_at` columns; data permanently deleted on CASCADE
- **Trade-off**: Data loss risk; no audit trail

### Email Verified Default False
- **Decision**: `email_verified BOOLEAN NOT NULL DEFAULT false`
- **Trade-off**: Users start unverified; must verify via email to access most features
