import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const { data: result, error: ue } = await supabase
    .from("donor_passports")
    .update({ last_renewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("user_id", auth.userId)
    .select("*");

  if (ue) throw ue;
  if (!result || result.length === 0) {
    return NextResponse.json({ error: "passport not found" }, { status: 404 });
  }

  return NextResponse.json({ passport: result[0] });
}
