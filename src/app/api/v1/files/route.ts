import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";

export const runtime = "nodejs";

const BLOB_STORE_DOMAIN = "private.blob.vercel-storage.com";
const BLOB_BASE = "https://8kbpkasoncfiacua.private.blob.vercel-storage.com";

function resolveUrl(raw: string): string {
  if (raw.startsWith("http")) return raw;
  return `${BLOB_BASE}/${raw.replace(/^\//, "")}`;
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
