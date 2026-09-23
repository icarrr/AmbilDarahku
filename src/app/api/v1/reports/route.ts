import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext } from "@/lib/auth-middleware";
import { hitLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const limited = hitLimit(request, { max: 10, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const body = await request.json();
    const { target_type, target_id, reason, notes } = body;

    if (!target_type || !target_id) {
      return NextResponse.json({ error: "target_type and target_id required" }, { status: 400 });
    }
    if (!["blood_request", "donor", "event"].includes(target_type)) {
      return NextResponse.json({ error: "invalid target_type" }, { status: 400 });
    }

    const { data: result, error } = await supabase
      .from("reports")
      .insert({
        target_type,
        target_id,
        reason: reason || "other",
        notes: notes || null,
        reported_by: auth.userId,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ report: result }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "report failed" }, { status: 500 });
  }
}