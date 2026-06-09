import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkAdmin } from "@/lib/auth-middleware";
import { SEED_SOURCES } from "@/lib/scrapers/source-registry";

export const runtime = "nodejs";

export async function GET() {
  const { data: sources, error } = await supabase
    .from("event_sources")
    .select("*")
    .order("source_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sources: sources || [] });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const admin = checkAdmin(auth);
  if (admin) return admin;

  try {
    const body = await request.json();
    const { source_type, source_name, source_url, scraper_config, detection_keywords, scrape_frequency_minutes } = body;

    if (!source_type || !source_name || !source_url) {
      return NextResponse.json({ error: "source_type, source_name, source_url required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("event_sources")
      .insert({
        source_type,
        source_name,
        source_url,
        scraper_config: scraper_config || {},
        detection_keywords: detection_keywords || null,
        scrape_frequency_minutes: scrape_frequency_minutes || 360,
      })
      .select("*");

    if (error) throw error;
    return NextResponse.json({ source: data![0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "create failed" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const admin = checkAdmin(auth);
  if (admin) return admin;

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("event_sources")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*");

    if (error) throw error;
    return NextResponse.json({ source: data![0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "update failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const admin = checkAdmin(auth);
  if (admin) return admin;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id query param required" }, { status: 400 });
    }

    const { error } = await supabase.from("event_sources").delete().eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "delete failed" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const admin = checkAdmin(auth);
  if (admin) return admin;

  try {
    const { action } = await request.json();

    if (action === "seed") {
      let count = 0;
      for (const s of SEED_SOURCES) {
        const { error } = await supabase.from("event_sources").upsert(
          {
            source_type: s.source_type,
            source_name: s.source_name,
            source_url: s.source_url,
            scraper_config: s.scraper_config,
            detection_keywords: s.detection_keywords,
            scrape_frequency_minutes: s.scrape_frequency_minutes,
          },
          { onConflict: "source_url", ignoreDuplicates: true }
        );
        if (!error) count++;
      }
      return NextResponse.json({ seeded: count });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "action failed" }, { status: 500 });
  }
}
