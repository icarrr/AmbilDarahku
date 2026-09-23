import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkPMIOrAdmin } from "@/lib/auth-middleware";
import { lookupName } from "@/lib/data/wilayah";
import { getPool } from "@/lib/pg";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request); if (!isAuthContext(auth)) return auth;
  const ve = checkVerifiedEmail(auth, request); if (ve) return ve;
  const pmi = checkPMIOrAdmin(auth); if (pmi) return pmi;

  // GROUP BY in SQL — only top-20 shipped to JS (counts only, no full column scan)
  const { rows } = await getPool().query<{ city: string; count: number }>(
    `SELECT city, COUNT(*)::int AS count
     FROM users
     WHERE city IS NOT NULL AND city <> ''
     GROUP BY city
     ORDER BY count DESC
     LIMIT 20`
  );

  const cities = rows.map((r) => ({ city: r.city, city_name: lookupName(r.city), count: r.count }));

  return NextResponse.json({ cities });
}