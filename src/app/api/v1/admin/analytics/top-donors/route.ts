import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkPMIOrAdmin } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request); if (!isAuthContext(auth)) return auth;
  const ve = checkVerifiedEmail(auth, request); if (ve) return ve;
  const pmi = checkPMIOrAdmin(auth); if (pmi) return pmi;

  const { data: donors } = await supabase
    .from("users")
    .select("id, full_name, blood_type, city, total_donations, total_points, avatar_url, username")
    .eq("role", "donor")
    .order("total_donations", { ascending: false })
    .limit(10);

  return NextResponse.json({ donors: donors || [] });
}
