import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkPMIOrAdmin } from "@/lib/auth-middleware";
import { lookupName } from "@/lib/data/wilayah";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const pmi = checkPMIOrAdmin(auth);
  if (pmi) return pmi;

  const { data: verifications } = await supabase
    .from("donor_verifications")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const userIds = [...new Set((verifications || []).map((v: any) => v.user_id))];
  const { data: users } = userIds.length > 0
    ? await supabase.from("users").select("id, full_name, email, phone, city, province").in("id", userIds)
    : { data: [] };

  const userMap = new Map((users || []).map((u: any) => [u.id, u]));
  const mapped = (verifications || []).map((v: any) => ({
    ...v,
    full_name: userMap.get(v.user_id)?.full_name,
    email: userMap.get(v.user_id)?.email,
    phone: userMap.get(v.user_id)?.phone,
    city: userMap.get(v.user_id)?.city,
    city_name: lookupName(userMap.get(v.user_id)?.city || ""),
    province_name: lookupName(userMap.get(v.user_id)?.province || ""),
  }));

  return NextResponse.json({ verifications: mapped });
}
