import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkPMIOrAdmin } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const pmi = checkPMIOrAdmin(auth);
  if (pmi) return pmi;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "open";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

  let query = supabase.from("reports").select("*").eq("status", status).order("created_at", { ascending: false }).limit(limit);
  if (status === "all") {
    query = supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(limit);
  }

  const { data: reports } = await query;

  const userIds = [...new Set((reports || []).map((r: any) => r.reported_by).filter(Boolean))];
  const { data: users } = userIds.length > 0
    ? await supabase.from("users").select("id, full_name").in("id", userIds)
    : { data: [] };
  const userMap = new Map((users || []).map((u: any) => [u.id, u]));

  const mapped = (reports || []).map((r: any) => ({
    ...r,
    reporter_name: r.reported_by ? userMap.get(r.reported_by)?.full_name || null : null,
  }));

  return NextResponse.json({ reports: mapped });
}