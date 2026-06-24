import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { lookupName } from "@/lib/data/wilayah";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const city = url.searchParams.get("city");

  let query = supabase
    .from("users")
    .select("id, full_name, blood_type, city, total_donations, total_points, avatar_url, username")
    .eq("role", "donor");

  if (city) query = query.eq("city", city);

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
