import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { token, new_password } = await request.json();
    if (!token || !new_password) {
      return NextResponse.json({ error: "token and new_password required" }, { status: 400 });
    }

    const { data: vt, error: vtError } = await supabase
      .from("verification_tokens")
      .select("*")
      .eq("token", token)
      .eq("type", "password_reset")
      .gt("expires_at", new Date().toISOString())
      .is("used_at", null)
      .maybeSingle();

    if (vtError || !vt) {
      return NextResponse.json({ error: "invalid or expired reset token" }, { status: 400 });
    }

    const hash = await hashPassword(new_password);

    const { error: u1 } = await supabase.from("users").update({ password_hash: hash, updated_at: new Date().toISOString() }).eq("id", vt.user_id);
    const { error: u2 } = await supabase.from("verification_tokens").update({ used_at: new Date().toISOString() }).eq("id", vt.id);
    if (u1 || u2) throw u1 || u2;

    return NextResponse.json({ message: "password reset successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "failed" }, { status: 500 });
  }
}
