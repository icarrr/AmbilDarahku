import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const { data: user } = await supabase.from("users").select("id").eq("username", username).maybeSingle();
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

  const { data: donations } = await supabase
    .from("donor_histories")
    .select("donation_date, location, institution")
    .eq("user_id", user.id)
    .order("donation_date", { ascending: false });

  const { data: badgesRaw } = await supabase
    .from("user_badges")
    .select("awarded_at, badges!inner(name, description, icon_url)")
    .eq("user_id", user.id)
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
