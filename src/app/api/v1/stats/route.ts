import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const { count: active } = await supabase.from("users").select("*", { count: "exact", head: true }).eq("availability_status", "available");
  const { data: donRows } = await supabase.from("donor_histories").select("bags");
  const totalDonations = (donRows || []).reduce((s: number, r: any) => s + (r.bags || 0), 0);

  const { data: cityRows } = await supabase.from("users").select("city").neq("city", "").not("city", "is", null);
  const citiesReached = new Set((cityRows || []).map((r: any) => r.city)).size;

  return NextResponse.json({
    stats: {
      active_donors: active || 0,
      lives_saved: totalDonations,
      partner_hospitals: 450,
      cities_reached: citiesReached,
    },
  });
}
