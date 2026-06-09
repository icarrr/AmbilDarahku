import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const { data: user } = await supabase.from("users").select("verification_level").eq("id", auth.userId).maybeSingle();
  const level = user ? user.verification_level : 0;

  const { data: history } = await supabase
    .from("donor_verifications")
    .select("*")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    current_level: level,
    max_level: 3,
    history: history || [],
  });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  try {
    const body = await request.json();
    const { level, verifier_role, notes } = body;

    if (!level || !verifier_role) {
      return NextResponse.json({ error: "level and verifier_role required" }, { status: 400 });
    }

    const { data: pending } = await supabase
      .from("donor_verifications")
      .select("id")
      .eq("user_id", auth.userId)
      .eq("level", level)
      .eq("status", "pending")
      .maybeSingle();

    if (pending) {
      return NextResponse.json({ error: "pending request already exists for this level" }, { status: 409 });
    }

    const { data: result, error: insError } = await supabase
      .from("donor_verifications")
      .insert({ user_id: auth.userId, level, status: "pending", verifier_role, notes: notes || null })
      .select("*");

    if (insError) throw insError;

    return NextResponse.json({ verification: result![0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "submission failed" }, { status: 500 });
  }
}
