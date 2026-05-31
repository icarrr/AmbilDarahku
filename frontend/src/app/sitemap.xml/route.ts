export const dynamic = "force-dynamic";

const BASE_URL = process.env.DOMAIN
  ? `https://${process.env.DOMAIN}`
  : "http://localhost:3000";
const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8080";

type UrlEntry = {
  loc: string;
  changefreq: string;
  priority: string;
  lastmod?: string;
};

const STATIC_ROUTES: UrlEntry[] = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/search", changefreq: "daily", priority: "0.9" },
  { loc: "/events", changefreq: "daily", priority: "0.8" },
  { loc: "/leaderboard", changefreq: "daily", priority: "0.7" },
  { loc: "/requests", changefreq: "daily", priority: "0.6" },
  { loc: "/privacy", changefreq: "monthly", priority: "0.2" },
  { loc: "/terms", changefreq: "monthly", priority: "0.2" },
];

export async function GET() {
  const urls: UrlEntry[] = [...STATIC_ROUTES];

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/requests`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      const requests: Array<{ id: string; created_at?: string }> = data.requests || [];
      for (const req of requests) {
        urls.push({
          loc: `/requests/share/${req.id}`,
          changefreq: "weekly",
          priority: "0.5",
          lastmod: req.created_at || undefined,
        });
      }
    }
  } catch {}

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${BASE_URL}${u.loc}</loc>
    ${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ""}    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
