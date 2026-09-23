// Client-safe helper — no node-only or server-only imports.
// getFileUrl proxying rules: external URLs pass through; Vercel Blob private
// URLs go through the signed proxy endpoint (inspected server-side).
export function getFileUrl(blobUrl: string | null | undefined): string | null {
  if (!blobUrl) return null;
  // External URLs (Google, etc.) pass through directly — proxy only handles Vercel Blob private URLs
  if (!blobUrl.includes("blob.vercel-storage.com")) return blobUrl;
  return `/api/v1/files?url=${encodeURIComponent(blobUrl)}`;
}