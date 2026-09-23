import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { hitLimit } from "@/lib/rate-limit";
import { PUBLIC_USER_FIELDS } from "@/lib/privacy";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = hitLimit(request);
  if (limited) return limited;

  const { id } = await params;

  const { data: fulfillments } = await supabase
    .from("request_fulfillments")
    .select("id, donor_id, bags, created_at")
    .eq("request_id", id)
    .order("created_at", { ascending: false });

  const donorIds = [...new Set((fulfillments || []).map((f: any) => f.donor_id))];
  const { data: donors } = donorIds.length > 0
    ? await supabase.from("users").select(PUBLIC_USER_FIELDS.join(",")).in("id", donorIds)
    : { data: [] };

  const donorMap = new Map((donors || []).map((d: any) => [d.id, d]));
  const mapped = (fulfillments || []).map((f: any) => ({
    ...f,
    donor_name: donorMap.get(f.donor_id)?.full_name,
  }));

  return NextResponse.json({ fulfillments: mapped });
}
