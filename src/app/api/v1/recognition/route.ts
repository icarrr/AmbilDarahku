import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail } from "@/lib/auth-middleware";
import { lookupName } from "@/lib/data/wilayah";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const { data: user } = await supabase.from("users").select("*").eq("id", auth.userId).maybeSingle();
  const { data: userBadges } = await supabase
    .from("user_badges")
    .select("*, badges!inner(name, icon_url, description)")
    .eq("user_id", auth.userId)
    .order("awarded_at", { ascending: false });

  const { data: titles } = await supabase.from("user_titles").select("*").eq("user_id", auth.userId).order("awarded_at", { ascending: false });
  const { data: passport } = await supabase.from("donor_passports").select("*").eq("user_id", auth.userId).maybeSingle();

  const badges = (userBadges || []).map((ub: any) => ({
    ...ub,
    badge_name: ub.badges?.name,
    badge_icon_url: ub.badges?.icon_url,
    badge_description: ub.badges?.description,
    badges: undefined,
  }));

  const { password_hash, ...safe } = user!;
  return NextResponse.json({
    user: {
      ...safe,
      city_name: lookupName(safe.city || ""),
      province_name: lookupName(safe.province || ""),
      district_name: lookupName(safe.district || ""),
    },
    badges,
    titles: titles || [],
    passport: passport || null,
  });
}
