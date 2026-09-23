import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkPMIOrAdmin } from "@/lib/auth-middleware";
import { getPool } from "@/lib/pg";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request); if (!isAuthContext(auth)) return auth;
  const ve = checkVerifiedEmail(auth, request); if (ve) return ve;
  const pmi = checkPMIOrAdmin(auth); if (pmi) return pmi;

  // GROUP BY in SQL — sums computed in DB, only top-20 shipped
  const { rows } = await getPool().query<{ institution: string; count: number; total_bags: number }>(
    `SELECT institution, COUNT(*)::int AS count, COALESCE(SUM(bags), 0)::int AS total_bags
     FROM donor_histories
     WHERE institution IS NOT NULL AND institution <> ''
     GROUP BY institution
     ORDER BY total_bags DESC
     LIMIT 20`
  );

  return NextResponse.json({ institutions: rows });
}