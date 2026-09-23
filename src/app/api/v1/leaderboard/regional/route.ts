import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { lookupName, searchWilayah } from "@/lib/data/wilayah";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const city = url.searchParams.get("city");

  let query = supabase
    .from("users")
    .select("id, full_name, blood_type, city, total_donations, total_points, avatar_url, username")
    .eq("role", "donor");

  if (city) {
    // Accept either a wilayah code or a typed city name ("Makassar", "73.01", "7301").
    if (/^\d+(\.\d+)?$/.test(city)) {
      query = query.eq("city", city.replace(/\./g, ""));
    } else {
      const matched = searchWilayah(city, 2);
      const ids = matched.map((m) => m.id);
      if (ids.length > 0) {
        query = query.in("city", ids);
      } else {
        query = query.eq("city", city);
      }
    }
  }

  const { data: leaderboard } = await query
    .order("total_points", { ascending: false })
    .order("total_donations", { ascending: false })
    .limit(50);

  const enriched = (leaderboard || []).map((entry: any) => ({
    ...entry,
    city_name: lookupName(entry.city || ""),
  }));

  return NextResponse.json({ leaderboard: enriched });
}
