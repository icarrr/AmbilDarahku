import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail } from "@/lib/auth-middleware";
import { hashPassword } from "@/lib/password";
import { lookupName } from "@/lib/data/wilayah";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const { data: user, error } = await supabase.from("users").select("*").eq("id", auth.userId).maybeSingle();
  if (error || !user) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  const { data: userBadges } = await supabase
    .from("user_badges")
    .select("*, badges(name, icon_url, description)")
    .eq("user_id", user.id)
    .order("awarded_at", { ascending: false });

  const { password_hash, ...safe } = user;
  return NextResponse.json({
    user: {
      ...safe,
      province_name: lookupName(safe.province || ""),
      city_name: lookupName(safe.city || ""),
      district_name: lookupName(safe.district || ""),
    },
    badges: userBadges || [],
  });
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  try {
    const body = await request.json();
    const allowedFields = [
      "full_name", "phone", "username", "avatar_url", "gender", "blood_type",
      "weight_kg", "height_cm", "province", "city", "district", "date_of_birth",
    ] as const;

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      const { error: updateError } = await supabase.from("users").update(updates).eq("id", auth.userId);
      if (updateError) throw updateError;
    }

    const { data: user } = await supabase.from("users").select("*").eq("id", auth.userId).maybeSingle();
    const { password_hash, ...safe } = user!;
    return NextResponse.json({
      user: {
        ...safe,
        province_name: lookupName(safe.province || ""),
        city_name: lookupName(safe.city || ""),
        district_name: lookupName(safe.district || ""),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "update failed" }, { status: 500 });
  }
}
