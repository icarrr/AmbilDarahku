import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkPMIOrAdmin } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request); if (!isAuthContext(auth)) return auth;
  const ve = checkVerifiedEmail(auth, request); if (ve) return ve;
  const pmi = checkPMIOrAdmin(auth); if (pmi) return pmi;

  const { data: rows } = await supabase
    .from("donor_histories")
    .select("donation_date, bags");

  const map = new Map<number, { count: number; total_bags: number }>();
  for (const r of rows || []) {
    if (!r.donation_date) continue;
    const year = new Date(r.donation_date).getFullYear();
    const entry = map.get(year) || { count: 0, total_bags: 0 };
    entry.count++;
    entry.total_bags += r.bags || 0;
    map.set(year, entry);
  }

  const years = Array.from(map.entries())
    .map(([year, v]) => ({ year, count: v.count, total_bags: v.total_bags }))
    .sort((a, b) => b.year - a.year);

  return NextResponse.json({ years });
}
