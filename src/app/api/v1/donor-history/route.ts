import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail } from "@/lib/auth-middleware";
import { signBlobUrl } from "@/lib/file";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const { data: histories } = await supabase
    .from("donor_histories")
    .select("*")
    .eq("user_id", auth.userId)
    .order("donation_date", { ascending: false });

  const safe = (histories || []).map((h: any) => ({
    ...h,
    proof_photo: signBlobUrl(h.proof_photo),
    proof_card: signBlobUrl(h.proof_card),
    proof_letter: signBlobUrl(h.proof_letter),
  }));

  return NextResponse.json({ histories: safe });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  try {
    const body = await request.json();
    const { donation_date, location, institution, bags, notes, proof_photo, proof_card, proof_letter } = body;

    if (!donation_date || !location || !institution) {
      return NextResponse.json({ error: "donation_date, location, and institution are required" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("donor_histories")
      .select("id")
      .eq("user_id", auth.userId)
      .eq("donation_date", donation_date)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "donation record already exists for this date" }, { status: 409 });
    }

    const hasPhoto = !!proof_photo;

    const { data: result, error: insError } = await supabase
      .from("donor_histories")
      .insert({
        user_id: auth.userId,
        donation_date,
        location,
        institution,
        bags: bags || 1,
        notes: notes || null,
        proof_photo: proof_photo || null,
        proof_card: proof_card || null,
        proof_letter: proof_letter || null,
        verification_status: hasPhoto ? "verified" : "pending",
        verification_level: hasPhoto ? "self" : "self",
      })
      .select("*");

    if (insError) throw insError;

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
    const { error: ue2 } = await supabase.from("users").update({
      total_donations: totalBags,
      total_points: totalBags * 10,
      donation_volume_total: totalBags * 0.45,
      last_donation_date: lastDonation,
      eligibility_status: daysSince >= 56 ? "eligible" : "waiting_period",
      updated_at: new Date().toISOString(),
    }).eq("id", auth.userId);
    if (ue2) throw ue2;

    const { data: badges } = await supabase.from("badges").select("*").order("min_donations");
    const { data: donor } = await supabase.from("users").select("total_donations").eq("id", auth.userId).maybeSingle();
    if (badges && donor) {
      for (const b of badges) {
        if (donor.total_donations >= b.min_donations) {
          const { data: existing } = await supabase.from("user_badges").select("id").eq("user_id", auth.userId).eq("badge_id", b.id).maybeSingle();
          if (!existing) {
            await supabase.from("user_badges").insert({ user_id: auth.userId, badge_id: b.id });
          }
        }
      }
    }

    return NextResponse.json({ history: result![0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "failed to create" }, { status: 500 });
  }
}
