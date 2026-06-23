import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthContext, checkAdmin } from "@/lib/auth-middleware";
import { discoverBloodRequests } from "@/lib/blood-request-discovery/runner";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  // Vercel Cron trigger — bypass JWT
  if (request.headers.get("x-vercel-cron")) {
    const secret = process.env.CRON_SECRET;
    if (secret) {
      const authHeader = request.headers.get("authorization") || "";
      if (authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
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
