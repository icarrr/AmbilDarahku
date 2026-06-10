export function getAppUrl(): string {
  const envUrl = typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL)
    : undefined;
  if (envUrl) return envUrl;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}
