import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const { id } = await params;

  try {
    const { data: existing, error: fetchErr } = await supabase
      .from("donor_histories")
      .select("id")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!existing) {
      return NextResponse.json({ error: "donor history not found" }, { status: 404 });
    }

    const { error: delErr } = await supabase
      .from("donor_histories")
      .delete()
      .eq("id", id);

    if (delErr) throw delErr;

    const { data: agg } = await supabase.from("donor_histories").select("bags").eq("user_id", auth.userId);
    const totalBags = (agg || []).reduce((s: number, r: any) => s + (r.bags || 0), 0);
    const { data: lastDate } = await supabase
      .from("donor_histories")
      .select("donation_date")
      .eq("user_id", auth.userId)
      .order("donation_date", { ascending: false })
      .limit(1);

    const lastDonation = lastDate?.[0]?.donation_date || null;
    const daysSince = lastDonation ? (Date.now() - new Date(lastDonation).getTime()) / 86400000 : 999;
    await supabase.from("users").update({
      total_donations: totalBags,
      total_points: totalBags * 10,
      donation_volume_total: totalBags * 0.45,
      last_donation_date: lastDonation,
      eligibility_status: daysSince >= 56 ? "eligible" : "waiting_period",
      updated_at: new Date().toISOString(),
    }).eq("id", auth.userId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "delete failed" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const { id } = await params;

  try {
    const body = await request.json();
    const fields = ["donation_date", "location", "institution", "bags", "notes", "proof_photo", "proof_card", "proof_letter"] as const;
    const updates: Record<string, any> = {};
    for (const f of fields) {
      if ((body as any)[f] !== undefined) updates[f] = (body as any)[f];
    }

    if ("proof_photo" in updates) {
      updates.verification_status = updates.proof_photo ? "verified" : "pending";
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

    const { data: agg } = await supabase.from("donor_histories").select("bags").eq("user_id", auth.userId);
    const totalBags = (agg || []).reduce((s: number, r: any) => s + (r.bags || 0), 0);
    const { data: lastDate } = await supabase
      .from("donor_histories")
      .select("donation_date")
      .eq("user_id", auth.userId)
      .order("donation_date", { ascending: false })
      .limit(1);

    const lastDonation = lastDate?.[0]?.donation_date || null;
    const daysSince = lastDonation ? (Date.now() - new Date(lastDonation).getTime()) / 86400000 : 999;
    await supabase.from("users").update({
      total_donations: totalBags,
      total_points: totalBags * 10,
      donation_volume_total: totalBags * 0.45,
      last_donation_date: lastDonation,
      eligibility_status: daysSince >= 56 ? "eligible" : "waiting_period",
      updated_at: new Date().toISOString(),
    }).eq("id", auth.userId);

    return NextResponse.json({ history: result[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "update failed" }, { status: 500 });
  }
}
