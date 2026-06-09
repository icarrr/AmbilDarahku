import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkAdmin } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request); if (!isAuthContext(auth)) return auth;
  const ve = checkVerifiedEmail(auth, request); if (ve) return ve;
  const admin = checkAdmin(auth); if (admin) return admin;

  const { id } = await params;

  const { data: award } = await supabase.from("award_configs").select("*").eq("id", id).maybeSingle();
  if (!award) return NextResponse.json({ error: "award not found" }, { status: 404 });

  return NextResponse.json({ award });
}
