import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail, checkAdmin } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request); if (!isAuthContext(auth)) return auth;
  const ve = checkVerifiedEmail(auth, request); if (ve) return ve;
  const admin = checkAdmin(auth); if (admin) return admin;

  const { data: titles } = await supabase
    .from("user_titles")
    .select("*")
    .order("awarded_at", { ascending: false });

  const userIds = [...new Set((titles || []).map((t: any) => t.user_id))];
  const { data: users } = userIds.length > 0
    ? await supabase.from("users").select("id, full_name").in("id", userIds)
    : { data: [] };

  const userMap = new Map((users || []).map((u: any) => [u.id, u]));
  const mapped = (titles || []).map((t: any) => ({
    ...t,
    user_name: userMap.get(t.user_id)?.full_name,
  }));

  return NextResponse.json({ titles: mapped });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request); if (!isAuthContext(auth)) return auth;
  const ve = checkVerifiedEmail(auth, request); if (ve) return ve;
  const admin = checkAdmin(auth); if (admin) return admin;

  try {
    const body = await request.json();
    const { user_id, title, description, config_id } = body;

    if (!user_id || !title) {
      return NextResponse.json({ error: "user_id and title required" }, { status: 400 });
    }

    const { data: result, error: ie } = await supabase
      .from("user_titles")
      .insert({ user_id, title, description: description || null, config_id: config_id || null, source: "manual" })
      .select("*");

    if (ie) throw ie;
    return NextResponse.json({ title: result![0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "create failed" }, { status: 500 });
  }
}
