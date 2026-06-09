import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthContext, checkAdmin } from "@/lib/auth-middleware";
import { discoverEvents } from "@/lib/event-discovery/runner";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const admin = checkAdmin(auth);
  if (admin) return admin;

  try {
    const result = await discoverEvents();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "discovery failed" }, { status: 500 });
  }
}
