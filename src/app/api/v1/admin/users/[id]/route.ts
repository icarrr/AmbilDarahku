import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkAdmin } from "@/lib/auth-middleware";

export const runtime = "nodejs";

// Admin-only single-user detail (phone, email, address, etc.).
// Used by AdminContactCard on the public /u/[username] page — the data is
// NEVER included in SSR HTML; it reaches the browser only through this
// admin-gated endpoint after client-side auth.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const admin = checkAdmin(auth);
  if (admin) return admin;

  const { id } = await params;

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message || "failed to fetch user" }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  const { password_hash, ...safe } = user;

  // Never cache contact data at the edge/data cache layer
  return NextResponse.json({ user: safe }, { headers: { "Cache-Control": "no-store" } });
}