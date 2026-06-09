import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const { data: leaderboard } = await supabase
    .from("users")
    .select("id, full_name, blood_type, city, total_donations, total_points, avatar_url, username")
    .eq("role", "donor")
    .order("total_points", { ascending: false })
    .order("total_donations", { ascending: false })
    .limit(100);

  return NextResponse.json({ leaderboard: leaderboard || [] });
}
