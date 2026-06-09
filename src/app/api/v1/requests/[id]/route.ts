import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: bloodRequest } = await supabase.from("blood_requests").select("*").eq("id", id).maybeSingle();
  if (!bloodRequest) return NextResponse.json({ error: "request not found" }, { status: 404 });

  const { data: fulfillments } = await supabase
    .from("request_fulfillments")
    .select("*")
    .eq("request_id", id)
    .order("created_at", { ascending: false });

  const donorIds = [...new Set((fulfillments || []).map((f: any) => f.donor_id))];
  const { data: donors } = donorIds.length > 0
    ? await supabase.from("users").select("id, full_name").in("id", donorIds)
    : { data: [] };

  const donorMap = new Map((donors || []).map((d: any) => [d.id, d]));
  const mapped = (fulfillments || []).map((f: any) => ({
    ...f,
    donor_name: donorMap.get(f.donor_id)?.full_name,
  }));

  return NextResponse.json({ request: bloodRequest, fulfillments: mapped });
}
