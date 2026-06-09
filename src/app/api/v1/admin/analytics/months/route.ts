import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkPMIOrAdmin } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request); if (!isAuthContext(auth)) return auth;
  const ve = checkVerifiedEmail(auth, request); if (ve) return ve;
  const pmi = checkPMIOrAdmin(auth); if (pmi) return pmi;

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const { data: rows } = await supabase
    .from("donor_histories")
    .select("donation_date, bags")
    .gte("donation_date", twelveMonthsAgo.toISOString().split("T")[0]);

  const map = new Map<string, { count: number; total_bags: number }>();
  for (const r of rows || []) {
    if (!r.donation_date) continue;
    const d = new Date(r.donation_date);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const entry = map.get(month) || { count: 0, total_bags: 0 };
    entry.count++;
    entry.total_bags += r.bags || 0;
    map.set(month, entry);
  }

  const months = Array.from(map.entries())
    .map(([month, v]) => ({ month, count: v.count, total_bags: v.total_bags }))
    .sort((a, b) => b.month.localeCompare(a.month));

  return NextResponse.json({ months });
}
