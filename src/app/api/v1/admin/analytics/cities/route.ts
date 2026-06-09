import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkPMIOrAdmin } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request); if (!isAuthContext(auth)) return auth;
  const ve = checkVerifiedEmail(auth, request); if (ve) return ve;
  const pmi = checkPMIOrAdmin(auth); if (pmi) return pmi;

  const { data: rows } = await supabase
    .from("users")
    .select("city")
    .neq("city", "")
    .not("city", "is", null);

  const map = new Map<string, number>();
  for (const r of rows || []) {
    map.set(r.city, (map.get(r.city) || 0) + 1);
  }

  const cities = Array.from(map.entries())
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return NextResponse.json({ cities });
}
