import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext } from "@/lib/auth-middleware";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const { data: user } = await supabase.from("users").select("*").eq("id", auth.userId).maybeSingle();
  if (!user) {
    return NextResponse.json({ error: "user not found" }, { status: 400 });
  }

  if (user.email_verified) {
    return NextResponse.json({ error: "email already verified" }, { status: 400 });
  }

  const { error: delError } = await supabase.from("verification_tokens").delete().eq("user_id", user.id).eq("type", "email_verification");
  if (delError) throw delError;

  const token = crypto.randomBytes(32).toString("hex");
  const { error: insError } = await supabase.from("verification_tokens").insert({
    user_id: user.id,
    token,
    type: "email_verification",
    expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  });
  if (insError) throw insError;

  sendVerificationEmail(user.email, token).catch(() => {});

  return NextResponse.json({ message: "verification email sent" });
}
