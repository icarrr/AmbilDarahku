import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail } from "@/lib/auth-middleware";
import { evaluateEligibility, getSearchPriority } from "@/lib/eligibility";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const { data: user } = await supabase.from("users").select("*").eq("id", auth.userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

  const { status } = evaluateEligibility({
    dateOfBirth: user.date_of_birth,
    totalDonations: user.total_donations,
    weightKg: parseFloat(user.weight_kg),
    lastDonationDate: user.last_donation_date,
  });

  return NextResponse.json({
    eligibility_status: status,
    last_donation_date: user.last_donation_date,
    search_priority: getSearchPriority(user.eligibility_status, user.availability_status, user.ready_again_date),
    availability_mode: user.availability_mode,
    availability_status: user.availability_status,
    reasons: status,
  });
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  try {
    const body = await request.json();
    const { availability_mode, availability_status, ready_again_date, unavailable_reason } = body;

    const { data: user } = await supabase.from("users").select("*").eq("id", auth.userId).maybeSingle();
    if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

    if (availability_mode === "manual") {
      const { error: ue } = await supabase.from("users").update({
        availability_mode: "manual",
        availability_status: availability_status || user.availability_status,
        ready_again_date: ready_again_date || null,
        unavailable_reason: unavailable_reason || null,
        updated_at: new Date().toISOString(),
      }).eq("id", auth.userId);
      if (ue) throw ue;
    } else if (availability_mode === "automatic") {
      const { error: ue } = await supabase.from("users").update({
        availability_mode: "automatic",
        ready_again_date: null,
        unavailable_reason: null,
        updated_at: new Date().toISOString(),
      }).eq("id", auth.userId);
      if (ue) throw ue;

      const { data: updated } = await supabase.from("users").select("*").eq("id", auth.userId).maybeSingle();
      if (updated) {
        const { status } = evaluateEligibility({
          dateOfBirth: updated.date_of_birth,
          totalDonations: updated.total_donations,
          weightKg: parseFloat(updated.weight_kg),
          lastDonationDate: updated.last_donation_date,
        });
        const newStatus = (status === "waiting_period" || status === "not_eligible") ? "temporarily_unavailable" : "available";
        const { error: ue2 } = await supabase.from("users").update({ availability_status: newStatus, updated_at: new Date().toISOString() }).eq("id", auth.userId);
        if (ue2) throw ue2;
      }
    }

    const { data: updated } = await supabase.from("users").select("*").eq("id", auth.userId).maybeSingle();
    const { password_hash, ...safe } = updated!;
    return NextResponse.json({ donor_status: safe });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "update failed" }, { status: 500 });
  }
}
