import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkPMIOrAdmin } from "@/lib/auth-middleware";
import { signBlobUrl } from "@/lib/file";
import { lookupName } from "@/lib/data/wilayah";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const pmi = checkPMIOrAdmin(auth);
  if (pmi) return pmi;

  const { data: claims } = await supabase
    .from("donation_claims")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const userIds = [...new Set((claims || []).map((c: any) => c.user_id))];
  const { data: users } = userIds.length > 0
    ? await supabase.from("users").select("id, full_name, email, phone, city").in("id", userIds)
    : { data: [] };

  const userMap = new Map((users || []).map((u: any) => [u.id, u]));
  const user = (id: string) => userMap.get(id) || {};
  const mapped = (claims || []).map((c: any) => ({
    ...c,
    proof_photo_url: signBlobUrl(c.proof_photo_url),
    proof_document_url: signBlobUrl(c.proof_document_url),
    full_name: user(c.user_id).full_name,
    email: user(c.user_id).email,
    phone: user(c.user_id).phone,
    blood_type: c.blood_type || user(c.user_id).blood_type,
    donor_city: user(c.user_id).city,
    donor_city_name: lookupName(user(c.user_id).city || ""),
  }));

  return NextResponse.json({ claims: mapped });
}
