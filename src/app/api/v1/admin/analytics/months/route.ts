import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkPMIOrAdmin } from "@/lib/auth-middleware";
import { getPool } from "@/lib/pg";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request); if (!isAuthContext(auth)) return auth;
  const ve = checkVerifiedEmail(auth, request); if (ve) return ve;
  const pmi = checkPMIOrAdmin(auth); if (pmi) return pmi;

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const from = twelveMonthsAgo.toISOString().split("T")[0];

  const { rows } = await getPool().query<{ month: string; count: number; total_bags: number }>(
    `SELECT to_char(donation_date, 'YYYY-MM') AS month,
            COUNT(*)::int AS count,
            COALESCE(SUM(bags), 0)::int AS total_bags
     FROM donor_histories
     WHERE donation_date >= $1
     GROUP BY 1
     ORDER BY month DESC`,
    [from]
  );

  return NextResponse.json({ months: rows });
}