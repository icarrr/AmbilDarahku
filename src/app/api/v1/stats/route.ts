import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { lookupName } from "@/lib/data/wilayah";

export const runtime = "nodejs";

// Public landing stats — cache 60s, not per-request
export const revalidate = 60;

export async function GET() {
  // Build-time / CI guard: no Supabase env → skip querying so static
  // prerender succeeds. Zeroed stats fall back to styled defaults on the
  // landing page; Vercel prod builds (env present) bake real numbers.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({
      stats: { active_donors: 0, lives_saved: 0, cities_reached: 0 },
    });
  }

  const { count: active } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("availability_status", "available");

  // Aggregate in SQL — no full-table transfer to JS
  const { data: sumRows } = await supabase.from("donor_histories").select("sum(bags)");
  const row = sumRows?.[0] as Record<string, unknown> | undefined;
  const totalDonations = Number(row?.sum ?? row?.["sum(bags)"] ?? 0);

  const { data: cityRows } = await supabase
    .from("users")
    .select("city")
    .neq("city", "")
    .not("city", "is", null);
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
