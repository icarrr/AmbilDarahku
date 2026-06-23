import { NextRequest, NextResponse } from "next/server";
import { discoverEvents } from "@/lib/event-discovery/runner";
import { discoverBloodRequests } from "@/lib/blood-request-discovery/runner";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  // Vercel Cron trigger — run both
  if (request.headers.get("x-vercel-cron")) {
    const secret = process.env.CRON_SECRET;
    if (secret) {
      const auth = request.headers.get("authorization") || "";
      if (auth !== `Bearer ${secret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    try {
      const events = await discoverEvents();
      const blood = await discoverBloodRequests();
      return NextResponse.json({ events, bloodRequests: blood });
    } catch (err: any) {
      return NextResponse.json({ error: err.message || "discovery failed" }, { status: 500 });
    }
  }

  // Manual trigger via admin UI — run both
  const { requireAuth, isAuthContext, checkAdmin } = await import("@/lib/auth-middleware");
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const admin = checkAdmin(auth);
  if (admin) return admin;

  try {
    const [events, blood] = await Promise.all([
      discoverEvents(),
      discoverBloodRequests(),
    ]);
    return NextResponse.json({ events, bloodRequests: blood });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "discovery failed" }, { status: 500 });
  }
}
