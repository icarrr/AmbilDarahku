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
- Uses Supabase JS client (not `pg` Pool) for all API routes
- `pg` kept as devDependency only for `scripts/migrate.ts` (DDL needs direct PostgreSQL)
- Custom JWT auth (not Supabase Auth)
- RLS disabled on all tables, anon key granted ALL privileges
- Lazy-init Proxy in `db.ts` for build-time env var resilience
- Analytics aggregates computed in JS (not SQL GROUP BY)
