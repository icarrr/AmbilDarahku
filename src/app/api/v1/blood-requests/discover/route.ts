import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthContext, checkAdmin } from "@/lib/auth-middleware";
import { discoverBloodRequests } from "@/lib/blood-request-discovery/runner";
import { isSchedulerAuthorized } from "@/lib/discovery/scheduler";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  // Internal scheduler trigger — verified via CRON_SECRET
  if (isSchedulerAuthorized(request)) {
    try {
      const result = await discoverBloodRequests();
      return NextResponse.json(result);
    } catch (err: any) {
      return NextResponse.json({ error: err.message || "discovery failed" }, { status: 500 });
    }
  }

  // Manual trigger via admin UI
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const admin = checkAdmin(auth);
  if (admin) return admin;

  try {
    const result = await discoverBloodRequests();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "discovery failed" }, { status: 500 });
  }
}
