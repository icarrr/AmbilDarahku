import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkAdmin } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request); if (!isAuthContext(auth)) return auth;
  const ve = checkVerifiedEmail(auth, request); if (ve) return ve;
  const admin = checkAdmin(auth); if (admin) return admin;

  const { data: awards } = await supabase.from("award_configs").select("*").order("created_at", { ascending: false });
  return NextResponse.json({ awards: awards || [] });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request); if (!isAuthContext(auth)) return auth;
  const ve = checkVerifiedEmail(auth, request); if (ve) return ve;
  const admin = checkAdmin(auth); if (admin) return admin;

  try {
    const body = await request.json();
    const { name, description, award_type, criteria, scope, scope_value } = body;

    if (!name || !award_type) {
      return NextResponse.json({ error: "name and award_type required" }, { status: 400 });
    }

    const { data: result, error: ie } = await supabase
      .from("award_configs")
      .insert({ name, description: description || null, award_type, criteria: JSON.stringify(criteria || {}), scope: scope || "national", scope_value: scope_value || null })
      .select("*");

    if (ie) throw ie;
    return NextResponse.json({ award: result![0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "create failed" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request); if (!isAuthContext(auth)) return auth;
  const ve = checkVerifiedEmail(auth, request); if (ve) return ve;
  const admin = checkAdmin(auth); if (admin) return admin;

  try {
    const body = await request.json();
    const { id, name, description, award_type, criteria, scope, scope_value, is_active } = body;

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (award_type !== undefined) updates.award_type = award_type;
    if (criteria !== undefined) updates.criteria = JSON.stringify(criteria);
    if (scope !== undefined) updates.scope = scope;
    if (scope_value !== undefined) updates.scope_value = scope_value;
    if (is_active !== undefined) updates.is_active = is_active;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "no fields to update" }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data: result, error: ue } = await supabase.from("award_configs").update(updates).eq("id", id).select("*");
    if (ue) throw ue;
    if (!result || result.length === 0) {
      return NextResponse.json({ error: "award not found" }, { status: 404 });
    }

    return NextResponse.json({ award: result[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "update failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request); if (!isAuthContext(auth)) return auth;
  const ve = checkVerifiedEmail(auth, request); if (ve) return ve;
  const admin = checkAdmin(auth); if (admin) return admin;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data: result, error: de } = await supabase.from("award_configs").delete().eq("id", id).select("id");
  if (de) throw de;
  if (!result || result.length === 0) {
    return NextResponse.json({ error: "award not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "award deleted" });
}
