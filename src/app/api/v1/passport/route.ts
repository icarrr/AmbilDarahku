import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const { data: passport } = await supabase.from("donor_passports").select("*").eq("user_id", auth.userId).maybeSingle();
  const { data: user } = await supabase.from("users").select("*").eq("id", auth.userId).maybeSingle();

  const { data: userBadges } = await supabase
    .from("user_badges")
    .select("*, badges!inner(name, icon_url, description, min_donations)")
    .eq("user_id", auth.userId)
    .order("awarded_at", { ascending: false });

  const { data: titles } = await supabase
    .from("user_titles")
    .select("*")
    .eq("user_id", auth.userId)
    .order("awarded_at", { ascending: false });

  const mapped = (userBadges || []).map((ub: any) => ({
    ...ub,
    badge: ub.badges,
    badges: undefined,
  }));

  const { password_hash, ...safe } = user!;
  return NextResponse.json({ passport: passport || null, user: safe, badges: mapped, titles: titles || [] });
}
