import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { lookupName } from "@/lib/data/wilayah";

export const runtime = "nodejs";

export async function GET() {
  const { count: active } = await supabase.from("users").select("*", { count: "exact", head: true }).eq("availability_status", "available");
  const { data: donRows } = await supabase.from("donor_histories").select("bags");
  const totalDonations = (donRows || []).reduce((s: number, r: any) => s + (r.bags || 0), 0);

  const { data: cityRows } = await supabase.from("users").select("city").neq("city", "").not("city", "is", null);
  // Resolve codes to names before dedupe so legacy codes + names collapse into one city
  const citiesReached = new Set((cityRows || []).map((r: any) => lookupName(r.city))).size;

  return NextResponse.json({
    stats: {
      active_donors: active || 0,
      lives_saved: totalDonations,
      cities_reached: citiesReached,
    },
  });
}
