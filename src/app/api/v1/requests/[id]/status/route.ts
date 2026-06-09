import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const { id } = await params;

  try {
    const body = await request.json();
    const { status: newStatus } = body;

    if (!["cancelled", "fulfilled"].includes(newStatus)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }

    const { data: result, error: ue } = await supabase
      .from("blood_requests")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("requester_id", auth.userId)
      .select("*");

    if (ue) throw ue;
    if (!result || result.length === 0) {
      return NextResponse.json({ error: "request not found or not authorized" }, { status: 404 });
    }

    return NextResponse.json({ request: result[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "update failed" }, { status: 500 });
  }
}
