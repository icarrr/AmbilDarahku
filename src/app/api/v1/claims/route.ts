import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const { data: claims } = await supabase
    .from("donation_claims")
    .select("*")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ claims: claims || [] });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  try {
    const body = await request.json();
    const { donation_date, location, institution_name, blood_type, volume_ml, proof_photo_url, proof_document_url, additional_notes } = body;

    if (!donation_date || !location) {
      return NextResponse.json({ error: "donation_date and location are required" }, { status: 400 });
    }

    const { data: result, error: insError } = await supabase
      .from("donation_claims")
      .insert({
        user_id: auth.userId,
        donation_date,
        location,
        institution_name: institution_name || "",
        blood_type: blood_type || "",
        volume_ml: volume_ml || 350,
        proof_photo_url: proof_photo_url || null,
        proof_document_url: proof_document_url || null,
        additional_notes: additional_notes || null,
      })
      .select("*");

    if (insError) throw insError;
    return NextResponse.json({ claim: result![0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "create failed" }, { status: 500 });
  }
}
