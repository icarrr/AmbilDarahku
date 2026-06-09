import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail } from "@/lib/auth-middleware";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const { data: existing } = await supabase.from("donor_passports").select("id").eq("user_id", auth.userId).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "passport already exists" }, { status: 409 });
  }

  const year = new Date().getFullYear();
  const { count } = await supabase.from("donor_passports").select("*", { count: "exact", head: true });
  const nextNum = ((count || 0) + 1).toString().padStart(6, "0");
  const passportNumber = `ADK-${year}-${nextNum}`;
  const qrToken = crypto.randomBytes(32).toString("hex");

  const { data: result, error: insError } = await supabase
    .from("donor_passports")
    .insert({ user_id: auth.userId, passport_number: passportNumber, qr_token: qrToken })
    .select("*");

  if (insError) throw insError;

  const { error: ue } = await supabase.from("users").update({ national_donor_id: passportNumber, updated_at: new Date().toISOString() }).eq("id", auth.userId);
  if (ue) throw ue;

  return NextResponse.json({ passport: result![0] }, { status: 201 });
}
