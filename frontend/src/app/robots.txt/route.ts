export const dynamic = "force-dynamic";

const DOMAIN = process.env.DOMAIN || "localhost:3000";
const BASE_URL = DOMAIN.includes("://") ? DOMAIN : `https://${DOMAIN}`;

export async function GET() {
  const body = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /profile/
Disallow: /donor-history/

Sitemap: ${BASE_URL}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
