import { createHmac } from "crypto";

// Signed proxy URLs for private blobs. Server embeds sig in private API
// responses; GET /api/v1/files only serves signed blobs or public allowlist.
// ponytail: swap to short-lived signed URLs + Redis for per-user expiry when multi-instance.

export const FILE_SIG_NAME = "sig";

function getSecret(): string {
  return process.env.JWT_SECRET || "";
}

export function signBlobPath(raw: string): string {
  const cleaned = raw.startsWith("/") ? raw.slice(1) : raw;
  const sig = createHmac("sha256", getSecret()).update(cleaned).digest("hex");
  return `/api/v1/files?url=${encodeURIComponent(cleaned)}&${FILE_SIG_NAME}=${sig}`;
}

export function verifyBlobSig(url: string, sig: string | null): boolean {
  if (!sig) return false;
  const cleaned = url.startsWith("/") ? url.slice(1) : url;
  const expected = createHmac("sha256", getSecret()).update(cleaned).digest("hex");
  return expected === sig;
}