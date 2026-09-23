import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkAdmin } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const admin = checkAdmin(auth);
  if (admin) return admin;

  const { id } = await params;

  try {
    const body = await request.json();
    const { role, contact_consent } = body;

    if (!role && contact_consent === undefined) {
      return NextResponse.json({ error: "role or contact_consent required" }, { status: 400 });
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (role) update.role = role;
    if (contact_consent !== undefined) update.contact_consent = Boolean(contact_consent);

    const { data: result, error: ue } = await supabase
      .from("users")
      .update(update)
      .eq("id", id)
      .select("*");

    if (ue) throw ue;
    if (!result || result.length === 0) {
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }

    const { password_hash, ...safe } = result[0];
    return NextResponse.json({ user: safe });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "update failed" }, { status: 500 });
  }
}
