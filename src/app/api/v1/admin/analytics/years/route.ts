import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkPMIOrAdmin } from "@/lib/auth-middleware";
import { getPool } from "@/lib/pg";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request); if (!isAuthContext(auth)) return auth;
  const ve = checkVerifiedEmail(auth, request); if (ve) return ve;
  const pmi = checkPMIOrAdmin(auth); if (pmi) return pmi;

  const { rows } = await getPool().query<{ year: number; count: number; total_bags: number }>(
    `SELECT EXTRACT(YEAR FROM donation_date)::int AS year,
            COUNT(*)::int AS count,
            COALESCE(SUM(bags), 0)::int AS total_bags
     FROM donor_histories
     WHERE donation_date IS NOT NULL
     GROUP BY 1
     ORDER BY year DESC`
  );

  return NextResponse.json({ years: rows });
}