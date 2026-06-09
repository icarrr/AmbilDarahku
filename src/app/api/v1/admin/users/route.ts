import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkAdmin } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const admin = checkAdmin(auth);
  if (admin) return admin;

  const { data: users } = await supabase.from("users").select("*").order("created_at", { ascending: false });
  const safe = (users || []).map((u: any) => {
    const { password_hash, ...rest } = u;
    return rest;
  });

  return NextResponse.json({ users: safe });
}
