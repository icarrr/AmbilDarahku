import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const { error } = await supabase.from("refresh_tokens").delete().eq("user_id", auth.userId);
  if (error) throw error;
  return NextResponse.json({ message: "logged out successfully" });
}
