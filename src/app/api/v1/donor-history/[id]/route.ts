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
    const fields = ["proof_photo", "proof_card", "proof_letter", "notes"] as const;
    const updates: Record<string, any> = {};
    for (const f of fields) {
      if ((body as any)[f] !== undefined) updates[f] = (body as any)[f];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "no fields to update" }, { status: 400 });
    }

    const { data: result, error: ue } = await supabase
      .from("donor_histories")
      .update(updates)
      .eq("id", id)
      .eq("user_id", auth.userId)
      .select("*");

    if (ue) throw ue;
    if (!result || result.length === 0) {
      return NextResponse.json({ error: "donor history not found" }, { status: 404 });
    }

    return NextResponse.json({ history: result[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "update failed" }, { status: 500 });
  }
}
