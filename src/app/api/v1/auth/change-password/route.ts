import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { checkPassword, hashPassword } from "@/lib/password";
import { requireAuth, isAuthContext } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  try {
    const { current_password, new_password } = await request.json();
    if (!current_password || !new_password) {
      return NextResponse.json({ error: "current_password and new_password required" }, { status: 400 });
    }

    const { data: user } = await supabase.from("users").select("*").eq("id", auth.userId).maybeSingle();
    if (!user) {
      return NextResponse.json({ error: "user not found" }, { status: 400 });
    }

    const valid = await checkPassword(current_password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "current password is incorrect" }, { status: 400 });
    }

    const hash = await hashPassword(new_password);
    const { error: updateError } = await supabase.from("users").update({ password_hash: hash, updated_at: new Date().toISOString() }).eq("id", auth.userId);
    if (updateError) throw updateError;

    return NextResponse.json({ message: "password changed successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "failed" }, { status: 500 });
  }
}
