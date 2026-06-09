import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: "token required" }, { status: 400 });
    }

    const { data: vt, error: vtError } = await supabase
      .from("verification_tokens")
      .select("*")
      .eq("token", token)
      .eq("type", "email_verification")
      .gt("expires_at", new Date().toISOString())
      .is("used_at", null)
      .maybeSingle();

    if (vtError || !vt) {
      return NextResponse.json({ error: "invalid or expired verification token" }, { status: 400 });
    }

    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", vt.user_id).maybeSingle();
    if (userError || !user) {
      return NextResponse.json({ error: "user not found" }, { status: 400 });
    }

    if (user.email_verified) {
      return NextResponse.json({ error: "email already verified" }, { status: 400 });
    }

    const { error: u1 } = await supabase.from("users").update({ email_verified: true, updated_at: new Date().toISOString() }).eq("id", user.id);
    const { error: u2 } = await supabase.from("verification_tokens").update({ used_at: new Date().toISOString() }).eq("id", vt.id);
    if (u1 || u2) throw u1 || u2;

    user.email_verified = true;
    const accessToken = generateAccessToken(user.id, user.email, user.role, true);
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

    const { error: insError } = await supabase.from("refresh_tokens").insert({
      user_id: user.id,
      token_hash: crypto.createHash("sha256").update(refreshToken).digest("hex"),
      expires_at: expiresAt.toISOString(),
    });
    if (insError) throw insError;

    return NextResponse.json({
      message: "email verified successfully",
      access_token: accessToken,
      refresh_token: refreshToken,
      user: sanitizeUser(user),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "verification failed" }, { status: 500 });
  }
}

function sanitizeUser(u: any) {
  const { password_hash, ...rest } = u;
  return rest;
}
