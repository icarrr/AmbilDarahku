import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkPMIOrAdmin } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const pmi = checkPMIOrAdmin(auth);
  if (pmi) return pmi;

  const { id } = await params;

  try {
    const body = await request.json();
    const { status, rejection_reason } = body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "status must be approved or rejected" }, { status: 400 });
    }

    const { data: result, error: ue } = await supabase
      .from("donation_claims")
      .update({ status, reviewed_by: auth.userId, reviewed_at: new Date().toISOString(), rejection_reason: rejection_reason || null, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*");

    if (ue) throw ue;
    if (!result || result.length === 0) {
      return NextResponse.json({ error: "claim not found" }, { status: 404 });
    }

    return NextResponse.json({ claim: result[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "review failed" }, { status: 500 });
  }
}
