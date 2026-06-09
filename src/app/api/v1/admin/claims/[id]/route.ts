import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkPMIOrAdmin } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const pmi = checkPMIOrAdmin(auth);
  if (pmi) return pmi;

  const { id } = await params;

  const { data: claim } = await supabase
    .from("donation_claims")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!claim) return NextResponse.json({ error: "claim not found" }, { status: 404 });

  const { data: user } = await supabase
    .from("users")
    .select("full_name, email, phone")
    .eq("id", claim.user_id)
    .maybeSingle();

  return NextResponse.json({
    ...claim,
    user_name: user?.full_name,
    user_email: user?.email,
    user_phone: user?.phone,
  });
}
