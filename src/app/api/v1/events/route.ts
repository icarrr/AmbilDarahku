import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkAdmin } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function GET() {
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: true });

  return NextResponse.json({ events: events || [] });
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
