import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { supabase } from "@/lib/db";
import { verifyBlobSig, FILE_SIG_NAME } from "@/lib/file-sign";

export const runtime = "nodejs";

const BLOB_STORE_DOMAIN = "private.blob.vercel-storage.com";
const BLOB_BASE = "https://8kbpkasoncfiacua.private.blob.vercel-storage.com";

// Static event fallback poster (deployed asset, public by design).
const PUBLIC_PATHS = new Set(["events/Gemini_Generated_Image_295p3i295p3i295p.jpg"]);

function resolveUrl(raw: string): string {
  if (raw.startsWith("http")) return raw;
  return `${BLOB_BASE}/${raw.replace(/^\//, "")}`;
}

// Public allowlist: event posters + avatars are shared with anonymous users.
async function isPublicAsset(raw: string): Promise<boolean> {
  const decoded = decodeURIComponent(raw);
  try {
    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("poster_url", decoded)
      .limit(1)
      .maybeSingle();
    if (event) return true;

    const { data: avatar } = await supabase
      .from("users")
      .select("id")
      .eq("avatar_url", decoded)
      .limit(1)
      .maybeSingle();
    if (avatar) return true;
  } catch {
    // allowlist check failure → treat as private
  }
  return false;
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  const url = resolveUrl(raw);

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith(BLOB_STORE_DOMAIN)) {
      return NextResponse.json({ error: "Invalid blob URL" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Private blobs require a valid HMAC signature (or public allowlist match).
  const sig = request.nextUrl.searchParams.get(FILE_SIG_NAME);
  const decodedRaw = decodeURIComponent(raw);
  if (sig && verifyBlobSig(raw, sig)) {
    // signed → serve
  } else if (PUBLIC_PATHS.has(decodedRaw.replace(/^\//, ""))) {
    // known static fallback → serve
  } else if (await isPublicAsset(raw)) {
    // event poster or avatar → serve
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await get(url, { access: "private" });
  if (result?.statusCode !== 200) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(result.stream as unknown as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": result.blob.contentType || "application/octet-stream",
      "Cache-Control": "public, max-age=86400",
    },
  });
}