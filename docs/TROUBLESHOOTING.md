# Troubleshooting — AmbilDarahku

## Common Issues

### Backend won't start

```
failed to connect to postgres: dial tcp 127.0.0.1:5432: connect: connection refused
```

- Ensure PostgreSQL is running: `docker compose up -d postgres`
- Check `.env` DB_HOST — Docker Compose uses `postgres`, local dev uses `localhost`
- If using Docker Compose, run all services: `docker compose up --build`

### Migrations fail

```
failed to run migrations: ERROR: type "public.uuid-ossp" does not exist
```

- Ensure `uuid-ossp` extension is available. The migration runs `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"` which should work on PostgreSQL 16.

### "invalid or expired token"

- Access token expired (default 15 min TTL)
- API client auto-refreshes; if refresh also fails, user is redirected to login
- Check system clock is synchronized (JWT validation uses timestamps)

### "email already registered" / "phone already registered"

- These are uniqueness checks. Both email and phone must be unique in the `users` table.

### Frontend shows blank page

- Check browser console for errors
- Verify `NEXT_PUBLIC_API_URL` in `frontend/.env.local` is correct (default: `/api/v1`)
- If using Docker Compose, ensure backend is healthy
- Next.js 16 is very new — check `node_modules/next/dist/docs/` for breaking changes

### "admin access required"

- Only users with `role = 'super_admin'` can access admin endpoints
- Seed a super admin by setting `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env`

### Login succeeds but profile doesn't load

- Check that `access_token` is stored in `localStorage`
- The `AuthProvider` calls `/auth/me` on mount; if it fails, tokens are cleared

## Known Gaps

| Issue | Impact | Status |
|---|---|---|
| Search results expose phone numbers | Privacy violation (PRD says phone not public) | Known gap |
| Badge auto-awarding not wired | Badges exist in DB but never assigned | Missing feature |
| File service `GetPublicURL` returns "TODO" | Uploaded files can't be retrieved | Incomplete |
| Radius filter ignored by backend | UI sends radius, backend ignores it | Mismatch |
| No auto-reactivation scheduler | `ready_again_date` is not checked by any cron job | Missing feature |
| No tests | No automated test coverage | Missing |

## Recovery Procedures

### Reset Database

```bash
docker compose down -v   # WARNING: destroys all volumes
docker compose up -d postgres
```

### Re-seed Admin

1. Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env`
2. Delete or update existing admin in DB
3. Restart backend

### Check Backend Logs

```bash
docker compose logs backend
# or for local dev
cd backend && go run ./cmd/server 2>&1
```
