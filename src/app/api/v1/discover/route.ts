import { NextRequest, NextResponse } from "next/server";
import { runDiscovery, isSchedulerAuthorized, isVercelCron } from "@/lib/discovery/scheduler";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * GET is used by Vercel Cron (POST is not supported for cron invocations).
 * Strictly scheduler-gated — no admin JWT, no public access.
 */
export async function GET(request: NextRequest) {
  if (!isVercelCron(request) && !isSchedulerAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return run(request);
}

export async function POST(request: NextRequest) {
  const isScheduled = isSchedulerAuthorized(request) || isVercelCron(request);

  if (isScheduled) {
    return run(request);
  }

  // Manual trigger via admin UI — same scrape service
  const { requireAuth, isAuthContext, checkAdmin } = await import("@/lib/auth-middleware");
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const admin = checkAdmin(auth);
  if (admin) return admin;

  return run(request);
}

async function run(request: NextRequest) {
  const isScheduled = isSchedulerAuthorized(request) || isVercelCron(request);
  try {
    const result = await runDiscovery(isScheduled ? "scheduler" : "manual");
    if ("conflicting" in result) {
      return NextResponse.json({ error: "Scrape is already running." }, { status: 409 });
    }
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "discovery failed" }, { status: 500 });
  }
}