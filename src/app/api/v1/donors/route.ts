import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext } from "@/lib/auth-middleware";
import { getSearchPriority } from "@/lib/eligibility";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const url = new URL(request.url);
  const bloodType = url.searchParams.get("blood_type");
  const city = url.searchParams.get("city");
  const availabilityStatus = url.searchParams.get("availability_status");
  const compatibleWith = url.searchParams.get("compatible_with");
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");
  const radius = url.searchParams.get("radius");

  let query = supabase.from("users").select("*").eq("role", "donor");

  if (bloodType) query = query.eq("blood_type", bloodType);
  if (city) query = query.eq("city", city);
  if (availabilityStatus) query = query.eq("availability_status", availabilityStatus);

  query = query.order("total_donations", { ascending: false });

  const { data: donors } = await query;

  const results = (donors || []).map((d: any) => {
    const priority = getSearchPriority(d.eligibility_status, d.availability_status, d.ready_again_date);
    const { password_hash, email, ...safe } = d;
    const buttonState = priority === 1 ? "enabled" : "disabled";
    let reason = "";
    if (buttonState === "disabled") {
      if (d.eligibility_status === "waiting_period") reason = "Sedang dalam masa tunggu";
      else if (d.eligibility_status === "not_eligible") reason = "Tidak memenuhi syarat";
      else if (d.availability_status === "temporarily_unavailable" && d.unavailable_reason) reason = d.unavailable_reason;
      else reason = "Belum tersedia";
    }
    return { ...safe, button_state: buttonState, reason_if_disabled: reason };
  });

  return NextResponse.json({ donors: results });
}
