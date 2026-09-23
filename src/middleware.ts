import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Paths always allowed during maintenance mode:
 * - /maintenance (the page itself — prevent redirect loop)
 * - /_next/* (Next.js static assets needed by the maintenance page)
 * - /favicon.*, /robots.txt, /sitemap.xml (standard web files)
 * - /api/v1/discover (scrape — must always run)
 * - /api/v1/admin/* (toggle maintenance on/off; admin APIs)
 * - /api/v1/auth/* (login — admin needs to log in to turn off maintenance)
 * - /login (page route for login)
 * - /admin/* (admin pages — admin needs to access dashboard)
 * - /privacy (legal page)
 * - /terms (legal page)
 */
const ALLOWLIST_PATHS = [
  "/maintenance",
  "/login",
  "/privacy",
  "/terms",
  "/api/v1/discover",
  "/api/v1/admin",
  "/api/v1/admin/",
  "/api/v1/auth",
  "/api/v1/auth/",
  "/api/v1/maintenance",
  "/api/v1/maintenance/",
  "/admin",
  "/admin/",
  "/_next/",
  "/favicon",
  "/robots.txt",
  "/sitemap.xml",
];

function isAllowlisted(pathname: string): boolean {
  return ALLOWLIST_PATHS.some((p) =>
    p.endsWith("/") ? pathname.startsWith(p) : pathname === p
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow matched paths
  if (isAllowlisted(pathname)) {
    return NextResponse.next();
  }

  // Skip static file extensions
  if (/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|json|woff2?|ttf|eot)$/i.test(pathname)) {
    return NextResponse.next();
  }

  try {
    // Check maintenance mode via Supabase REST API (Edge-compatible)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.next();
    }

    const res = await fetch(
      `${supabaseUrl}/rest/v1/config?key=eq.maintenance&select=value`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        signal: AbortSignal.timeout(3000), // 3s timeout — fail open
      }
    );

    if (res.ok) {
      const rows = await res.json();
      const enabled = rows?.[0]?.value?.enabled === true;

      if (enabled) {
        // API routes return JSON 503
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { error: "Maintenance mode", maintenance: true },
            { status: 503 }
          );
        }
        // Page routes → show maintenance page (rewrite keeps original URL)
        return NextResponse.rewrite(new URL("/maintenance", request.url));
      }
    }
  } catch {
    // Fail open — if Supabase is unreachable, allow traffic through
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except Next.js internal and static files
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
