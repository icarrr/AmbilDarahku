import { Pool } from "pg";
import type { NextRequest } from "next/server";
import { discoverEvents } from "@/lib/event-discovery/runner";
import { discoverBloodRequests } from "@/lib/blood-request-discovery/runner";
import { discoverProfiles } from "@/lib/profile-discovery/runner";

export const SCRAPE_JOB_NAME = "discover";
const LOCK_TTL = "2 hours";
const DONATION_INTERVAL_DAYS = 56;

export function createPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
}

/**
 * Internal scheduler trigger (Supabase pg_cron → pg_net).
 * Fail closed: requires header + correct CRON_SECRET. Public callers cannot forge.
 */
export function isSchedulerAuthorized(request: NextRequest): boolean {
  if (!request.headers.get("x-scheduled")) return false;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (request.headers.get("authorization") || "") === `Bearer ${secret}`;
}

/**
 * Atomic lock — single statement. Exactly one caller wins.
 * INSERT wins (first time), or UPDATE succeeds when free / stale-locked.
 * Stale RUNNING locks (crashed process) are recovered after locked_until expires.
 */
export async function tryAcquireScrapeLock(
  pool: Pool,
  jobName: string = SCRAPE_JOB_NAME
): Promise<boolean> {
  const { rowCount } = await pool.query(
    `INSERT INTO scrape_jobs (job_name, status, started_at, locked_until, updated_at)
     VALUES ($1, 'RUNNING', NOW(), NOW() + $2::interval, NOW())
     ON CONFLICT (job_name) DO UPDATE
       SET status = 'RUNNING', started_at = NOW(),
           locked_until = NOW() + $2::interval, updated_at = NOW()
       WHERE scrape_jobs.status <> 'RUNNING' OR scrape_jobs.locked_until < NOW()
     RETURNING job_name`,
    [jobName, LOCK_TTL]
  );
  return (rowCount || 0) === 1;
}

export async function releaseScrapeLock(
  pool: Pool,
  jobName: string = SCRAPE_JOB_NAME
): Promise<void> {
  await pool.query(
    `UPDATE scrape_jobs
     SET status = 'IDLE', started_at = NULL, locked_until = NULL, updated_at = NOW()
     WHERE job_name = $1`,
    [jobName]
  );
}

async function insertRunStart(pool: Pool, trigger: string): Promise<string> {
  const { rows } = await pool.query(
    `INSERT INTO scrape_runs (job_name, trigger, status)
     VALUES ($1, $2, 'RUNNING') RETURNING id`,
    [SCRAPE_JOB_NAME, trigger]
  );
  return rows[0].id;
}

async function finishRun(
  pool: Pool,
  runId: string,
  status: "SUCCESS" | "FAILED",
  durationMs: number,
  result: Record<string, unknown> | null,
  errorMessage?: string
): Promise<void> {
  await pool.query(
    `UPDATE scrape_runs
     SET status = $2, finished_at = NOW(), duration_ms = $3,
         result = $4, error_message = $5
     WHERE id = $1`,
    [runId, status, durationMs, result ? JSON.stringify(result) : null, errorMessage?.slice(0, 2000) || null]
  );
}

/**
 * Recompute availability_status for automatic-mode donors from the existing
 * business rule (src/lib/eligibility.ts + donor-status PUT):
 *   eligible = age 18–65 AND weight >= 50kg AND last donation >= 56 days ago.
 * Only changed rows are written — no artificial DB traffic.
 */
export async function updateAutomaticDonorStatuses(pool: Pool): Promise<number> {
  const { rowCount } = await pool.query(
    `UPDATE users
     SET availability_status = ad.availability_status, updated_at = NOW()
     FROM (
       SELECT id,
         CASE WHEN
           (date_of_birth IS NULL OR EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 18 AND 65)
           AND (weight_kg IS NULL OR weight_kg >= 50)
           AND (last_donation_date IS NULL OR (CURRENT_DATE - last_donation_date) >= $1)
         THEN 'available' ELSE 'temporarily_unavailable' END AS availability_status
       FROM users
       WHERE availability_mode = 'automatic'
     ) ad
     WHERE users.id = ad.id AND users.availability_status IS DISTINCT FROM ad.availability_status`,
    [DONATION_INTERVAL_DAYS]
  );
  return rowCount || 0;
}

export interface DiscoveryRunResult {
  trigger: "scheduler" | "manual";
  runId: string;
  startedAt: string;
  durationMs: number;
  status: "SUCCESS";
  donorStatusesUpdated: number;
  events: Awaited<ReturnType<typeof discoverEvents>>;
  bloodRequests: Awaited<ReturnType<typeof discoverBloodRequests>>;
  profiles: Awaited<ReturnType<typeof discoverProfiles>>;
}

/**
 * Single scrape implementation shared by the automatic scheduler and the
 * admin "Scrape Now" button. Idempotent (runners upsert via unique indexes).
 */
export async function runDiscovery(
  trigger: "scheduler" | "manual" = "manual"
): Promise<DiscoveryRunResult | { conflicting: true }> {
  const pool = createPool();
  try {
    if (!(await tryAcquireScrapeLock(pool))) {
      return { conflicting: true };
    }

    const runId = await insertRunStart(pool, trigger);
    const startedAt = Date.now();

    try {
      const [events, bloodRequests, profiles] = await Promise.all([
        discoverEvents(),
        discoverBloodRequests(),
        discoverProfiles(),
      ]);
      const donorStatusesUpdated = await updateAutomaticDonorStatuses(pool);
      const durationMs = Date.now() - startedAt;

      const result = { events, bloodRequests, profiles, donorStatusesUpdated };
      await finishRun(pool, runId, "SUCCESS", durationMs, result);

      return {
        trigger,
        runId,
        startedAt: new Date(startedAt).toISOString(),
        durationMs,
        status: "SUCCESS",
        donorStatusesUpdated,
        events,
        bloodRequests,
        profiles,
      };
    } catch (err: any) {
      await finishRun(pool, runId, "FAILED", Date.now() - startedAt, null, err?.message);
      throw err;
    }
  } finally {
    await releaseScrapeLock(pool);
    await pool.end();
  }
}