import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const { data: donations } = await supabase
    .from("donor_histories")
    .select("donation_date, location, institution")
    .eq("user_id", auth.userId)
    .order("donation_date", { ascending: false });

  const { data: badgesRaw } = await supabase
    .from("user_badges")
    .select("awarded_at, badges!inner(name, description, icon_url)")
    .eq("user_id", auth.userId)
    .order("awarded_at", { ascending: false });

  const donationEntries = (donations || []).map((d: any) => ({
    date: d.donation_date,
    type: "donation",
    title: d.location,
    description: d.institution,
    icon_url: null,
  }));

  const badgeEntries = (badgesRaw || []).map((b: any) => ({
    date: b.awarded_at,
    type: "badge",
    title: b.badges?.name,
    description: b.badges?.description,
    icon_url: b.badges?.icon_url,
  }));

  const entries = [...donationEntries, ...badgeEntries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(offset, offset + limit);

  return NextResponse.json({ entries });
}
