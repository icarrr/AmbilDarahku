import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const { data: user } = await supabase.from("users").select("trust_score").eq("id", auth.userId).maybeSingle();
  const score = user ? user.trust_score : 0;

  return NextResponse.json({ trust_score: parseFloat(score), breakdown: null });
}
