import { NextRequest, NextResponse } from "next/server";

// In-memory sliding-window rate limiter for public listing endpoints.
// Single-instance deployments only (Vercel serverless: best-effort).
// ponytail: replace with Redis/D1-backed limiter when multi-instance.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const DEFAULT_MAX = 60; // requests per window per IP
const DEFAULT_WINDOW_MS = 60_000;

export function hitLimit(
  request: NextRequest,
  opts: { max?: number; windowMs?: number } = {}
): NextResponse | null {
  const max = opts.max ?? DEFAULT_MAX;
  const windowMs = opts.windowMs ?? DEFAULT_WINDOW_MS;

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  const now = Date.now();
  let bucket = buckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
  }

  bucket.count += 1;
  buckets.set(ip, bucket);

  // periodic sweep so the map cannot grow unbounded
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }

  if (bucket.count > max) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "terlalu banyak permintaan, coba lagi nanti" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  return null;
}

/** Cap a requested page size to [min, max]. */
export function clampLimit(raw: string | null, fallback = 20, max = 30): number {
  const n = raw ? parseInt(raw, 10) : NaN;
  if (isNaN(n) || n <= 0) return fallback;
  return Math.min(n, max);
}