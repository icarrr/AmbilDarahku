# Troubleshooting — AmbilDarahku

## Common Issues

### Backend won't start
```
failed to connect to postgres: dial tcp 127.0.0.1:5432: connect: connection refused
```
- Ensure PostgreSQL is running: `docker compose up -d postgres`
- Check `.env` DB_HOST — Docker Compose uses `postgres`, local dev uses `localhost`

### Migrations fail
- Ensure `uuid-ossp` extension is available in PostgreSQL
- Run `docker compose down -v && docker compose up -d postgres` to reset

### "invalid or expired token"
- Access token TTL is 15 min (configurable); API client auto-refreshes
- Verify system clock is synchronized (JWT uses timestamps)

### Login "Failed to fetch"
- Previously caused by seed blocking HTTP server — fixed by background goroutine
- If persists, check backend is healthy: `curl http://localhost:8080/api/v1/health`

### "email already registered" / "phone already registered"
- Uniqueness checks on `users.email` and `users.phone`

### Frontend shows blank page
- Check browser console for errors
- Verify `NEXT_PUBLIC_API_URL` in `frontend/.env.local` (default: `/api/v1`)
- If Docker, ensure backend is healthy

### "admin access required"
- Only `role = 'super_admin'` can access admin endpoints
- Seed a super admin: set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env`

### Profile doesn't show updated data
- Profile page now fetches from `/auth/me` API instead of stale AuthContext
- If still stale, restart frontend or clear localStorage

### Email verification doesn't update profile
- Fixed: `verify-email/page.tsx` now calls `await refreshUser()` after storing new JWT tokens
- Previously only stored new tokens but AuthContext still showed `email_verified: false`

### "Saya Sudah Donor" button disabled
- Tooltip shows reason: incompatible blood type, not available, or not eligible
- User must have compatible blood type and be eligible/available

### Blood request shows "0 open" when data exists
- Search endpoint moved to auth group — must be authenticated
- Seed runs in background (~20 min); API returns empty until seed finishes

## Known Gaps

| Issue | Impact | Status |
|---|---|---|
| No automated tests | Zero coverage | Known gap |
| CORS allows all origins | Security risk in production | Known gap |
| No rate limiting (except forgot-password) | Brute force vulnerability | Known gap |
| No audit logging | No admin action trail | Known gap |
| No production deployment | No cloud, HTTPS, domain | Known gap |

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

### Rebuild Everything
```bash
docker compose down
docker compose up --build
```
