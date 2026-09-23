import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkPMIOrAdmin } from "@/lib/auth-middleware";
import { signBlobUrl } from "@/lib/file";

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
    ? await supabase.from("users").select("id, full_name, email, phone").in("id", userIds)
    : { data: [] };

  const userMap = new Map((users || []).map((u: any) => [u.id, u]));
  const mapped = (claims || []).map((c: any) => ({
    ...c,
    proof_photo_url: signBlobUrl(c.proof_photo_url),
    proof_document_url: signBlobUrl(c.proof_document_url),
    user_name: userMap.get(c.user_id)?.full_name,
    user_email: userMap.get(c.user_id)?.email,
    user_phone: userMap.get(c.user_id)?.phone,
  }));

  return NextResponse.json({ claims: mapped });
}
