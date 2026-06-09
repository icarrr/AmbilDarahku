import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { refresh_token } = await request.json();
    if (!refresh_token) {
      return NextResponse.json({ error: "refresh_token required" }, { status: 400 });
    }

    const hash = crypto.createHash("sha256").update(refresh_token).digest("hex");
    const { data: stored, error: tokenError } = await supabase
      .from("refresh_tokens")
      .select("*")
      .eq("token_hash", hash)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (tokenError || !stored) {
      return NextResponse.json({ error: "invalid or expired refresh token" }, { status: 401 });
    }

    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", stored.user_id).maybeSingle();
    if (userError || !user) {
      return NextResponse.json({ error: "user not found" }, { status: 401 });
    }

    const { error: delError } = await supabase.from("refresh_tokens").delete().eq("token_hash", hash);
    if (delError) throw delError;

    const accessToken = generateAccessToken(user.id, user.email, user.role, user.email_verified);
    const newRefreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

    const { error: insError } = await supabase.from("refresh_tokens").insert({
      user_id: user.id,
      token_hash: crypto.createHash("sha256").update(newRefreshToken).digest("hex"),
      expires_at: expiresAt.toISOString(),
    });
    if (insError) throw insError;

    return NextResponse.json({
      user: sanitizeUser(user),
      access_token: accessToken,
      refresh_token: newRefreshToken,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "refresh failed" }, { status: 500 });
  }
}

function sanitizeUser(u: any) {
  const { password_hash, ...rest } = u;
  return rest;
}
