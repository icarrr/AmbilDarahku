import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkPMIOrAdmin } from "@/lib/auth-middleware";
import { getPool } from "@/lib/pg";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const pmi = checkPMIOrAdmin(auth);
  if (pmi) return pmi;

  const { count: pendingClaims } = await supabase.from("donation_claims").select("*", { count: "exact", head: true }).eq("status", "pending");
  const { count: pendingVerifs } = await supabase.from("donor_verifications").select("*", { count: "exact", head: true }).eq("status", "pending");
  const { count: totalUsers } = await supabase.from("users").select("*", { count: "exact", head: true });
  const { count: totalDonors } = await supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "donor");

  // SUM in SQL — no full-table transfer to JS
  const { rows } = await getPool().query<{ total: number }>(
    "SELECT COALESCE(SUM(bags), 0)::int AS total FROM donor_histories"
  );
  const totalDonations = rows[0]?.total || 0;

  return NextResponse.json({
    pending_claims: pendingClaims || 0,
    pending_verifications: pendingVerifs || 0,
    total_users: totalUsers || 0,
    total_donors: totalDonors || 0,
    total_donations: totalDonations,
  });
}
