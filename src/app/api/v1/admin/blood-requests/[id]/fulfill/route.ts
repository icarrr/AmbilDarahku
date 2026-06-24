import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkPMIOrAdmin } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  const admin = checkPMIOrAdmin(auth);
  if (admin) return admin;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const notes = body.notes || null;

  // Check request exists and is not already fulfilled
  const { data: existing } = await supabase
    .from("blood_requests")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Permintaan tidak ditemukan" }, { status: 404 });
  }

  if (existing.status === "fulfilled") {
    return NextResponse.json({ error: "Permintaan sudah terpenuhi" }, { status: 400 });
  }

  const updateData: Record<string, any> = {
    status: "fulfilled",
    updated_at: new Date().toISOString(),
  };

  if (notes) {
    updateData.notes = notes;
  }

  const { error } = await supabase
    .from("blood_requests")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch updated record
  const { data: updated } = await supabase
    .from("blood_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return NextResponse.json({ request: updated });
}
