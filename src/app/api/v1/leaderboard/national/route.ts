import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { lookupName } from "@/lib/data/wilayah";

export const runtime = "nodejs";

export async function GET() {
  const { data: leaderboard } = await supabase
    .from("users")
    .select("id, full_name, blood_type, city, total_donations, total_points, avatar_url, username")
    .eq("role", "donor")
    .order("total_points", { ascending: false })
    .order("total_donations", { ascending: false })
    .limit(100);

  const enriched = (leaderboard || []).map((entry: any) => ({
    ...entry,
    city_name: lookupName(entry.city || ""),
  }));

  return NextResponse.json({ leaderboard: enriched });
}
