import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const { data: user } = await supabase.from("users").select("trust_score").eq("username", username).maybeSingle();
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

  return NextResponse.json({ trust_score: parseFloat(user.trust_score) });
}
