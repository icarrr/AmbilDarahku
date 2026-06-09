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
    const { status, notes } = body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "status must be approved or rejected" }, { status: 400 });
    }

    const { data: verif } = await supabase.from("donor_verifications").select("*").eq("id", id).maybeSingle();
    if (!verif) return NextResponse.json({ error: "verification not found" }, { status: 404 });

    const { data: result, error: ue } = await supabase
      .from("donor_verifications")
      .update({ status, verifier_id: auth.userId, notes: notes || undefined, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*");

    if (ue) throw ue;

    if (status === "approved") {
      const { data: user } = await supabase.from("users").select("verification_level").eq("id", verif.user_id).maybeSingle();
      if (user && verif.level > user.verification_level) {
        const { error: ue2 } = await supabase.from("users").update({ verification_level: verif.level, updated_at: new Date().toISOString() }).eq("id", verif.user_id);
        if (ue2) throw ue2;
      }
    }

    return NextResponse.json({ verification: result![0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "review failed" }, { status: 500 });
  }
}
