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

  const { data: requests } = await supabase
    .from("blood_requests")
    .select("*")
    .eq("requester_id", auth.userId)
    .order("created_at", { ascending: false });

  const safe = (requests || []).map((r: any) => ({
    ...r,
    city_name: lookupName(r.city || ""),
  }));

  return NextResponse.json({ requests: safe });
}
