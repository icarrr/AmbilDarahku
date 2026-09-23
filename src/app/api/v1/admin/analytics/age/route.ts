import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkPMIOrAdmin } from "@/lib/auth-middleware";
import { getPool } from "@/lib/pg";

export const runtime = "nodejs";

const BUCKETS = [
  { range: "17-20", min: 17, max: 20 },
  { range: "21-25", min: 21, max: 25 },
  { range: "26-30", min: 26, max: 30 },
  { range: "31-35", min: 31, max: 35 },
  { range: "36-40", min: 36, max: 40 },
  { range: "41-50", min: 41, max: 50 },
  { range: "51-60", min: 51, max: 60 },
  { range: "60+", min: 61, max: 200 },
];

export async function GET(request: NextRequest) {
  const auth = requireAuth(request); if (!isAuthContext(auth)) return auth;
  const ve = checkVerifiedEmail(auth, request); if (ve) return ve;
  const pmi = checkPMIOrAdmin(auth); if (pmi) return pmi;

  // Aggregated in SQL — no full-table transfer to JS
  const sql = `
    SELECT CASE
      WHEN EXTRACT(YEAR FROM age(NOW(), date_of_birth)) BETWEEN 17 AND 20 THEN '17-20'
      WHEN EXTRACT(YEAR FROM age(NOW(), date_of_birth)) BETWEEN 21 AND 25 THEN '21-25'
      WHEN EXTRACT(YEAR FROM age(NOW(), date_of_birth)) BETWEEN 26 AND 30 THEN '26-30'
      WHEN EXTRACT(YEAR FROM age(NOW(), date_of_birth)) BETWEEN 31 AND 35 THEN '31-35'
      WHEN EXTRACT(YEAR FROM age(NOW(), date_of_birth)) BETWEEN 36 AND 40 THEN '36-40'
      WHEN EXTRACT(YEAR FROM age(NOW(), date_of_birth)) BETWEEN 41 AND 50 THEN '41-50'
      WHEN EXTRACT(YEAR FROM age(NOW(), date_of_birth)) BETWEEN 51 AND 60 THEN '51-60'
      ELSE '60+'
    END AS range,
    COUNT(*)::int AS count
    FROM users
    WHERE date_of_birth IS NOT NULL
    GROUP BY 1`;

  const { rows } = await getPool().query<{ range: string; count: number }>(sql);
  const countBy = new Map(rows.map((r) => [r.range, r.count]));
  const buckets = BUCKETS.map((b) => ({ range: b.range, count: countBy.get(b.range) || 0 }));

  return NextResponse.json({ buckets });
}