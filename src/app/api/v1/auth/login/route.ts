import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { checkPassword } from "@/lib/password";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "email and password required" }, { status: 400 });
    }

    const { data: user, error } = await supabase.from("users").select("*").eq("email", email).maybeSingle();
    if (error || !user) {
      return NextResponse.json({ error: "invalid email or password" }, { status: 401 });
    }

    const valid = await checkPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "invalid email or password" }, { status: 401 });
    }

    const accessToken = generateAccessToken(user.id, user.email, user.role, user.email_verified);
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

    const { error: rtError } = await supabase.from("refresh_tokens").insert({
      user_id: user.id,
      token_hash: crypto.createHash("sha256").update(refreshToken).digest("hex"),
      expires_at: expiresAt.toISOString(),
    });
    if (rtError) throw rtError;

    return NextResponse.json({
      user: sanitizeUser(user),
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "login failed" }, { status: 500 });
  }
}

function sanitizeUser(u: any) {
  const { password_hash, ...rest } = u;
  return rest;
}
