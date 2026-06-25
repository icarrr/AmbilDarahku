import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext } from "@/lib/auth-middleware";
import { getSearchPriority } from "@/lib/eligibility";
import { lookupName, searchWilayah } from "@/lib/data/wilayah";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const url = new URL(request.url);
  const bloodType = url.searchParams.get("blood_type");
  const city = url.searchParams.get("city");
  const cityName = url.searchParams.get("city_name");
  const availabilityStatus = url.searchParams.get("availability_status");
  const compatibleWith = url.searchParams.get("compatible_with");

  let query = supabase.from("users").select("*").eq("role", "donor");

  if (bloodType) query = query.eq("blood_type", bloodType);
  // city param: if numeric, treat as ID exact match; otherwise text search
  if (city) {
    if (/^\d+$/.test(city)) {
      query = query.eq("city", city);
    } else {
      const matched = searchWilayah(city, 2);
      const ids = matched.map((m) => m.id);
      if (ids.length > 0) {
        query = query.in("city", ids);
      }
    }
  }
  if (cityName) {
    const matched = searchWilayah(cityName, 2);
    const ids = matched.map((m) => m.id);
    if (ids.length > 0) {
      query = query.in("city", ids);
    }
  }
  if (availabilityStatus) query = query.eq("availability_status", availabilityStatus);

  query = query.order("total_donations", { ascending: false });

  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : NaN;
  if (!isNaN(limit) && limit > 0) query = query.limit(limit);

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
    return {
      ...safe,
      city_name: lookupName(safe.city || ""),
      province_name: lookupName(safe.province || ""),
      district_name: lookupName(safe.district || ""),
      button_state: buttonState,
      reason_if_disabled: reason,
    };
  });

  return NextResponse.json({ donors: results });
}
