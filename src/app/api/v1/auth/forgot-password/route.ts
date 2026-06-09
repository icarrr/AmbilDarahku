import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

const forgotLimit = new Map<string, number>();

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    const now = Date.now();
    const last = forgotLimit.get(email);
    if (last && now - last < 60000) {
      return NextResponse.json({ error: "terlalu banyak permintaan, coba lagi dalam 1 menit" }, { status: 429 });
    }
    forgotLimit.set(email, now);

    const { data: user } = await supabase.from("users").select("id, email").eq("email", email).maybeSingle();
    if (!user) {
      return NextResponse.json({ message: "Kami akan mengirim email permintaan reset sandi jika email terdaftar" });
    }

    const { error: delError } = await supabase.from("verification_tokens").delete().eq("user_id", user.id).eq("type", "password_reset");
    if (delError) throw delError;

    const token = crypto.randomBytes(32).toString("hex");
    const { error: insError } = await supabase.from("verification_tokens").insert({
      user_id: user.id,
      token,
      type: "password_reset",
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    });
    if (insError) throw insError;

    sendPasswordResetEmail(user.email, token).catch(() => {});

    return NextResponse.json({ message: "Kami akan mengirim email permintaan reset sandi jika email terdaftar" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "failed" }, { status: 500 });
  }
}
