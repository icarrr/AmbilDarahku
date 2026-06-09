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
    .select("institution, bags");

  const map = new Map<string, { count: number; total_bags: number }>();
  for (const r of rows || []) {
    if (!r.institution) continue;
    const entry = map.get(r.institution) || { count: 0, total_bags: 0 };
    entry.count++;
    entry.total_bags += r.bags || 0;
    map.set(r.institution, entry);
  }

  const institutions = Array.from(map.entries())
    .map(([institution, v]) => ({ institution, count: v.count, total_bags: v.total_bags }))
    .sort((a, b) => b.total_bags - a.total_bags)
    .slice(0, 20);

  return NextResponse.json({ institutions });
}
