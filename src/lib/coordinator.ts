// The public "hubungi koordinator" contact point. All wa.me buttons point
// here — never to individual donor/requester numbers. Set NEXT_PUBLIC_COORDINATOR_PHONE
// (E.164, e.g. "6281234567890"). When unset, no direct contact button renders.
const RAW = process.env.NEXT_PUBLIC_COORDINATOR_PHONE || "";

export const COORDINATOR_PHONE = RAW.replace(/[^0-9+]/g, "");

export function coordinatorWaLink(message: string): string | null {
  if (!COORDINATOR_PHONE) return null;
  return `https://wa.me/${COORDINATOR_PHONE}?text=${encodeURIComponent(message)}`;
}