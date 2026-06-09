import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const { data: passport } = await supabase
    .from("donor_passports")
    .select("*")
    .eq("qr_token", token)
    .eq("is_active", true)
    .maybeSingle();

  if (!passport) {
    return NextResponse.json({ valid: false, error: "passport not found" }, { status: 404 });
  }

  const { data: user } = await supabase.from("users").select("full_name, blood_type").eq("id", passport.user_id).maybeSingle();

  return NextResponse.json({
    valid: true,
    passport_number: passport.passport_number,
    full_name: user?.full_name || "",
    blood_type: user?.blood_type || "",
  });
}
