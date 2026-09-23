import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkAdmin } from "@/lib/auth-middleware";
import { hitLimit, clampLimit } from "@/lib/rate-limit";
import { PUBLIC_EVENT_FIELDS, toPublicEvent } from "@/lib/privacy";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const limited = hitLimit(request);
  if (limited) return limited;

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status") || "upcoming"; // upcoming | past | all
  const limit = clampLimit(url.searchParams.get("limit"), 12, 60);
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10) || 0);

  let query = supabase
    .from("events")
    .select(PUBLIC_EVENT_FIELDS.join(","))
    .eq("is_archived", false);

  if (statusParam === "upcoming") query = query.in("status", ["upcoming", "ongoing"]);
  else if (statusParam === "past") query = query.eq("status", "completed");

  const { data: events } = await query
    .order("event_date", { ascending: true })
    .range(offset, offset + limit - 1);

  return NextResponse.json({ events: (events || []).map((e: any) => toPublicEvent(e)) });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const admin = checkAdmin(auth);
  if (admin) return admin;

  try {
    const body = await request.json();
    const { title, location, city, event_date, start_time, end_time, description, organizer, contact_phone, quota, poster_url } = body;

    if (!title || !location || !city || !event_date || !start_time || !end_time) {
      return NextResponse.json({ error: "required fields missing" }, { status: 400 });
    }

    const { data: result, error: ie } = await supabase
      .from("events")
      .insert({
        title, location, city, event_date, start_time, end_time,
        description: description || null,
        organizer: organizer || "",
        contact_phone: contact_phone || "",
        quota: quota || 0,
        poster_url: poster_url || null,
      })
      .select("*");

    if (ie) throw ie;
    return NextResponse.json({ event: result![0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "create failed" }, { status: 500 });
  }
}
