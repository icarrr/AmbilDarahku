import { NextRequest, NextResponse } from "next/server";
import { runDiscovery, isSchedulerAuthorized } from "@/lib/discovery/scheduler";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const isScheduled = isSchedulerAuthorized(request);

  if (isScheduled) {
    try {
      const result = await runDiscovery("scheduler");
      if ("conflicting" in result) {
        return NextResponse.json({ error: "Scrape is already running." }, { status: 409 });
      }
      return NextResponse.json(result);
    } catch (err: any) {
      return NextResponse.json({ error: err.message || "discovery failed" }, { status: 500 });
    }
  }

  // Manual trigger via admin UI — same scrape service
  const { requireAuth, isAuthContext, checkAdmin } = await import("@/lib/auth-middleware");
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const admin = checkAdmin(auth);
  if (admin) return admin;

  try {
    const result = await runDiscovery("manual");
    if ("conflicting" in result) {
      return NextResponse.json({ error: "Scrape is already running." }, { status: 409 });
    }
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "discovery failed" }, { status: 500 });
  }
}