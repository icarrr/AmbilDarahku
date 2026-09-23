import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthContext, checkAdmin } from "@/lib/auth-middleware";
import { createPool } from "@/lib/discovery/scheduler";

export const runtime = "nodejs";

interface RunRow {
  id: string;
  trigger: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  result: string | Record<string, unknown> | null;
  error_message: string | null;
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const admin = checkAdmin(auth);
  if (admin) return admin;

  const pool = createPool();
  try {
    const [{ rows: jobs }, { rows: runs }] = await Promise.all([
      pool.query(
        `SELECT job_name, status, started_at, locked_until, updated_at
         FROM scrape_jobs WHERE job_name = 'discover'`
      ),
      pool.query<RunRow>(
        `SELECT id, trigger, status, started_at, finished_at, duration_ms, result, error_message
         FROM scrape_runs ORDER BY started_at DESC LIMIT 15`
      ),
    ]);

    // pg_cron job diagnostics — null when pg_cron unavailable (local/docker)
    let cronJob: Record<string, unknown> | null = null;
    let cronRuns: Record<string, unknown>[] = [];
    try {
      const { rows: j } = await pool.query(
        `SELECT jobid, jobname, schedule, command, active
         FROM cron.job WHERE jobname = 'adk-scrape'`
      );
      cronJob = j[0] || null;
      if (cronJob) {
        // job_run_details has no jobname column — filter by jobid
        const { rows: jr } = await pool.query(
          `SELECT status, return_message, start_time, end_time
           FROM cron.job_run_details WHERE jobid = $1
           ORDER BY start_time DESC LIMIT 5`,
          [cronJob.jobid]
        );
        cronRuns = jr;
      }
    } catch {
      // pg_cron not installed — fine, Vercel Cron covers scheduling
    }

    const job = jobs[0] || null;
    const intervalMinutes = parseInt(process.env.SCRAPE_INTERVAL_MINUTES || "60", 10);
    const pgCronEnabled = !!process.env.SCRAPE_TARGET_URL && !!process.env.CRON_SECRET;
    const enabled = pgCronEnabled; // Vercel Cron runs regardless (vercel.json)

    const lastRun = runs[0] || null;
    const nextRunAt = enabled && lastRun?.started_at
      ? new Date(new Date(lastRun.started_at).getTime() + intervalMinutes * 60000).toISOString()
      : null;

    // Consecutive failures since the last SUCCESS run
    let consecutiveFailures = 0;
    for (const r of runs) {
      if (r.status === "FAILED") consecutiveFailures++;
      else if (r.status === "SUCCESS") break;
    }

    const runsOut = runs.map((r) => {
      let result = r.result;
      if (typeof result === "string") {
        try { result = JSON.parse(result); } catch { result = null; }
      }
      const res = (result || {}) as Record<string, any>;
      const events = res.events || {};
      const blood = res.bloodRequests || {};
      const profiles = res.profiles || {};
      void blood; void profiles;
      return {
        id: r.id,
        trigger: r.trigger,
        status: r.status,
        startedAt: r.started_at,
        finishedAt: r.finished_at,
        durationMs: r.duration_ms,
        errorMessage: r.error_message,
        counts: {
          eventsNew: events.totalNew ?? null,
          eventsScraped: events.totalScraped ?? null,
          bloodRequestsAffected: blood.affected ?? null,
          profilesInserted: profiles.profilesInserted ?? null,
          donorsInserted: profiles.donorsInserted ?? null,
          donorStatusesUpdated: res.donorStatusesUpdated ?? null,
        },
      };
    });

    return NextResponse.json({
      enabled,
      scheduler: "vercel-cron",
      pgCronJob: cronJob,
      pgCronRuns: cronRuns,
      intervalMinutes,
      status: job?.status || "IDLE",
      lockStartedAt: job?.started_at || null,
      lockExpiresAt: job?.locked_until || null,
      lastRunAt: lastRun?.started_at || null,
      consecutiveFailures,
      nextRunAt,
      runs: runsOut,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "failed to read scrape status" }, { status: 500 });
  } finally {
    await pool.end();
  }
}