import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const city = searchParams.get("city");
  const month = searchParams.get("month");
  const offset = (page - 1) * limit;

  let query = supabase
    .from("events")
    .select("*", { count: "exact" })
    .eq("is_archived", true)
    .order("event_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (city) {
    query = query.ilike("city", `%${city}%`);
  }
  if (month) {
    query = query.gte("event_date", `${month}-01`).lt("event_date", `${month}-32`);
  }

  const { data: events, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    events: events || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
