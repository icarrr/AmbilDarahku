import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail } from "@/lib/auth-middleware";
import { calculateTrustScore } from "@/lib/trust-score";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const { data: user } = await supabase.from("users").select("*").eq("id", auth.userId).maybeSingle();
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

  const now = new Date();
  const created = new Date(user.created_at);
  const accountAgeDays = (now.getTime() - created.getTime()) / 86400000;

  const { data: claimStats } = await supabase
    .from("donation_claims")
    .select("status");

  const total = claimStats?.length || 0;
  const approved = claimStats?.filter(c => c.status === "approved").length || 0;

  let profileFields = 0;
  if (user.full_name) profileFields++;
  if (user.phone) profileFields++;
  if (user.city) profileFields++;
  if (user.blood_type) profileFields++;
  if (user.province) profileFields++;

  const breakdown = calculateTrustScore({
    totalDonations: user.total_donations || 0,
    verificationLevel: user.verification_level || 0,
    totalClaims: total,
    approvedClaims: approved,
    profileFields,
    accountAgeDays,
  });

  const { error: ue } = await supabase.from("users").update({ trust_score: breakdown.overall, updated_at: new Date().toISOString() }).eq("id", auth.userId);
  if (ue) throw ue;

  return NextResponse.json({ trust_score: breakdown.overall, breakdown });
}
