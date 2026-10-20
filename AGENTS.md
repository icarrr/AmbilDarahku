<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Structure
- Frontend (Next.js) lives at **project root** (not in `frontend/`)
- All API routes: `src/app/api/v1/`
- All pages: `src/app/`
- Supabase client: `src/lib/db.ts`
- Migration script: `scripts/migrate.ts`

## Commands
- `npm run dev` — start dev server (from root)
- `npm run build` — build for production
- `npm run migrate` — run DB schema migration (uses `DATABASE_URL`)
- Always use `nvm use 22` before running any npm command

## Key Decisions
- Uses Supabase JS client for API routes, except admin stats/analytics, which use the `pg` Pool in `src/lib/pg.ts` for SQL GROUP BY (needs `DATABASE_URL` at runtime)
- `pg` is a devDependency but is also used at runtime (analytics, scrape lock) as well as by `scripts/migrate.ts`
- Custom JWT auth (not Supabase Auth)
- RLS enabled on tables; server uses the service key (bypasses RLS), so authorization is enforced in route code
- Lazy-init Proxy in `db.ts` for build-time env var resilience
