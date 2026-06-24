import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkPMIOrAdmin } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  const admin = checkPMIOrAdmin(auth);
  if (admin) return admin;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "";

  let query = supabase.from("blood_requests").select("*");

  if (status) {
    query = query.eq("status", status);
  } else {
    query = query.neq("status", "fulfilled");
  }

  query = query.order("created_at", { ascending: false }).limit(100);

  const { data: requests } = await query;

  // Enrich with requester info
  const requesterIds = [...new Set((requests || []).map((r: any) => r.requester_id).filter(Boolean))];
  const { data: users } = requesterIds.length > 0
    ? await supabase.from("users").select("id, full_name").in("id", requesterIds)
    : { data: [] };

  const userMap = new Map((users || []).map((u: any) => [u.id, u]));
  const enriched = (requests || []).map((r: any) => ({
    ...r,
    requester_name: r.requester_id ? userMap.get(r.requester_id)?.full_name || null : null,
  }));

  return NextResponse.json({ requests: enriched });
}
