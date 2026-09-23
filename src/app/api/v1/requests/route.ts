import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail } from "@/lib/auth-middleware";
import { hitLimit, clampLimit } from "@/lib/rate-limit";
import { PUBLIC_BLOOD_REQUEST_FIELDS, toPublicRequest } from "@/lib/privacy";
import { lookupName } from "@/lib/data/wilayah";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const limited = hitLimit(request);
  if (limited) return limited;

  const url = new URL(request.url);
  const bloodType = url.searchParams.get("blood_type");
  const urgency = url.searchParams.get("urgency");
  const status = url.searchParams.get("status") || "open"; // open | all
  const search = url.searchParams.get("search");
  const hospital = url.searchParams.get("hospital");
  const limit = clampLimit(url.searchParams.get("limit"), 20, 30);

  let query = supabase
    .from("blood_requests")
    .select(PUBLIC_BLOOD_REQUEST_FIELDS.join(","));

  // Server-side filtering — no full fetch + client filter
  if (status === "open") query = query.eq("status", "open");
  if (bloodType) query = query.eq("blood_type", bloodType);
  if (urgency) query = query.eq("urgency", urgency);
  if (search) query = query.ilike("patient_name", `%${search}%`);
  if (hospital) query = query.eq("hospital", hospital);

  query = query.order("urgency", { ascending: false });
  query = query.order("created_at", { ascending: false });
  query = query.limit(limit);

  const { data: requests } = await query;

  requests?.sort((a: any, b: any) => {
    const order: Record<string, number> = { critical: 0, urgent: 1, normal: 2 };
    return (order[a.urgency] ?? 2) - (order[b.urgency] ?? 2);
  });

  const safe = (requests || []).map((r: any) => {
    const pub = toPublicRequest(r);
    return { ...pub, city_name: lookupName(pub.city || "") };
  });

  return NextResponse.json({ requests: safe });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  try {
    const body = await request.json();
    const { patient_name, hospital, blood_type, bags, urgency, city, contact_phone, notes } = body;

    if (!patient_name || !hospital || !blood_type || !bags || !urgency || !city) {
      return NextResponse.json({ error: "required fields missing" }, { status: 400 });
    }

    const { data: result, error: ie } = await supabase
      .from("blood_requests")
      .insert({
        requester_id: auth.userId,
        patient_name,
        hospital,
        blood_type,
        rhesus: "+",
        bags,
        urgency,
        city,
        contact_phone: contact_phone || "",
        notes: notes || null,
      })
      .select("*");

    if (ie) throw ie;
    return NextResponse.json({ request: result![0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "create failed" }, { status: 500 });
  }
}
