import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const { id } = await params;
  const { data: claim } = await supabase
    .from("donation_claims")
    .select("*")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (!claim) return NextResponse.json({ error: "claim not found" }, { status: 404 });
  return NextResponse.json({ claim });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const { id } = await params;

  const { data: existing } = await supabase
    .from("donation_claims")
    .select("*")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "claim not found" }, { status: 404 });
  if (existing.status !== "pending") {
    return NextResponse.json({ error: "only pending claims can be updated" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const allowedFields = ["donation_date", "location", "institution_name", "blood_type", "volume_ml", "proof_photo_url", "proof_document_url", "additional_notes"];

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const f of allowedFields) {
      if ((body as any)[f] !== undefined) updates[f] = (body as any)[f];
    }

    delete updates.updated_at;
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "no fields to update" }, { status: 400 });
    }
    updates.updated_at = new Date().toISOString();

    const { data: result, error: ue } = await supabase
      .from("donation_claims")
      .update(updates)
      .eq("id", id)
      .select("*");

    if (ue) throw ue;
    return NextResponse.json({ claim: result![0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "update failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const { id } = await params;

  const { data: existing } = await supabase
    .from("donation_claims")
    .select("*")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "claim not found" }, { status: 404 });
  if (existing.status !== "pending") {
    return NextResponse.json({ error: "only pending claims can be cancelled" }, { status: 400 });
  }

  const { error: de } = await supabase.from("donation_claims").delete().eq("id", id);
  if (de) throw de;
  return NextResponse.json({ message: "claim cancelled" });
}
