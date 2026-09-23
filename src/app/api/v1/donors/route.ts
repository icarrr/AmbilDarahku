import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext } from "@/lib/auth-middleware";
import { getSearchPriority } from "@/lib/eligibility";
import { lookupName, searchWilayah } from "@/lib/data/wilayah";
import { hitLimit, clampLimit } from "@/lib/rate-limit";
import { PUBLIC_USER_FIELDS } from "@/lib/privacy";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const limited = hitLimit(request);
  if (limited) return limited;

  const url = new URL(request.url);
  const bloodType = url.searchParams.get("blood_type");
  const city = url.searchParams.get("city");
  const cityName = url.searchParams.get("city_name");
  const availabilityStatus = url.searchParams.get("availability_status");
  const compatibleWith = url.searchParams.get("compatible_with");
  const limit = clampLimit(url.searchParams.get("limit"), 20, 30);

  let query = supabase
    .from("users")
    .select(PUBLIC_USER_FIELDS.join(","))
    .eq("role", "donor");

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

  query = query.limit(limit);

  const { data: donors } = await query;

  const results = (donors || []).map((d: any) => {
    const priority = getSearchPriority(d.eligibility_status, d.availability_status, d.ready_again_date);
    const { password_hash, email, phone, ...safe } = d;
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
