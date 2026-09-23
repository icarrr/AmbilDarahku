import { Pool } from "pg";

// Singleton direct-PostgreSQL pool for SQL aggregation endpoints
// (analytics need GROUP BY, unsupported by the Supabase JS client).
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}