import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkPMIOrAdmin } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const pmi = checkPMIOrAdmin(auth);
  if (pmi) return pmi;

  const { id } = await params;

  try {
    const body = await request.json();
    const status = body.status;
    if (!["open", "resolved", "dismissed"].includes(status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }

    const { data: result, error } = await supabase
      .from("reports")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ report: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "update failed" }, { status: 500 });
  }
}