import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const { data: user } = await supabase.from("users").select("*").eq("username", username).maybeSingle();
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

  const { data: userBadges } = await supabase
    .from("user_badges")
    .select("*, badges!inner(name, icon_url)")
    .eq("user_id", user.id)
    .order("awarded_at", { ascending: false });

  const { data: titles } = await supabase.from("user_titles").select("*").eq("user_id", user.id).order("awarded_at", { ascending: false });
  const { data: passport } = await supabase.from("donor_passports").select("*").eq("user_id", user.id).maybeSingle();

  const badges = (userBadges || []).map((ub: any) => ({
    ...ub,
    badge_name: ub.badges?.name,
    badge_icon_url: ub.badges?.icon_url,
    badges: undefined,
  }));

  const { password_hash, email, phone, ...safe } = user;
  return NextResponse.json({ user: safe, badges, titles: titles || [], passport: passport || null });
}
