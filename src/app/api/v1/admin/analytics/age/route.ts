import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkPMIOrAdmin } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request); if (!isAuthContext(auth)) return auth;
  const ve = checkVerifiedEmail(auth, request); if (ve) return ve;
  const pmi = checkPMIOrAdmin(auth); if (pmi) return pmi;

  const { data: users } = await supabase.from("users").select("date_of_birth");

  const buckets = [
    { range: "17-20", min: 17, max: 20 },
    { range: "21-25", min: 21, max: 25 },
    { range: "26-30", min: 26, max: 30 },
    { range: "31-35", min: 31, max: 35 },
    { range: "36-40", min: 36, max: 40 },
    { range: "41-50", min: 41, max: 50 },
    { range: "51-60", min: 51, max: 60 },
    { range: "60+", min: 61, max: 200 },
  ];

  const now = new Date();
  const counts = new Array(buckets.length).fill(0);

  for (const u of users || []) {
    if (!u.date_of_birth) continue;
    const age = Math.floor((now.getTime() - new Date(u.date_of_birth).getTime()) / 31557600000);
    for (let i = 0; i < buckets.length; i++) {
      if (age >= buckets[i].min && age <= buckets[i].max) {
        counts[i]++;
        break;
      }
    }
  }

  const result = buckets.map((b, i) => ({ range: b.range, count: counts[i] }));
  return NextResponse.json({ buckets: result });
}
