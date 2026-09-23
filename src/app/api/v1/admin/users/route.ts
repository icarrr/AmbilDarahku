import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkAdmin } from "@/lib/auth-middleware";
import { lookupName } from "@/lib/data/wilayah";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const admin = checkAdmin(auth);
  if (admin) return admin;

  const { data: users } = await supabase.from("users").select("*").order("created_at", { ascending: false });
  const safe = (users || []).map((u: any) => {
    const { password_hash, ...rest } = u;
    return {
      ...rest,
      city_name: lookupName(rest.city || ""),
      province_name: lookupName(rest.province || ""),
      district_name: lookupName(rest.district || ""),
    };
  });

  return NextResponse.json({ users: safe });
}
