import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { hitLimit } from "@/lib/rate-limit";
import { toPublicUser } from "@/lib/privacy";
import { lookupName } from "@/lib/data/wilayah";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const limited = hitLimit(request);
  if (limited) return limited;

  const { username } = await params;

  const { data: user } = await supabase.from("users").select("*").eq("username", username).maybeSingle();
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

  // Public only — never expose qr_token (QR verify secret).
  const { data: passport } = await supabase
    .from("donor_passports")
    .select("id, user_id, passport_number, issued_at, last_renewed_at, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: userBadges } = await supabase
    .from("user_badges")
    .select("*, badges!inner(name, icon_url, description, min_donations)")
    .eq("user_id", user.id)
    .order("awarded_at", { ascending: false });

  const { data: titles } = await supabase
    .from("user_titles")
    .select("*")
    .eq("user_id", user.id)
    .order("awarded_at", { ascending: false });

  const mapped = (userBadges || []).map((ub: any) => ({
    ...ub,
    badge: ub.badges,
    badges: undefined,
  }));

  const pub = toPublicUser(user);
  return NextResponse.json({
    passport: passport || null,
    user: {
      ...pub,
      city_name: lookupName(pub.city || ""),
      province_name: lookupName(pub.province || ""),
      district_name: lookupName(pub.district || ""),
    },
    badges: mapped,
    titles: titles || [],
  });
}
