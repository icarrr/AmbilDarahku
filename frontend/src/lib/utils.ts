import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(iso: string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("id-ID", options || { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

export function getRecoveryEndDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    date.setDate(date.getDate() + 56);
    return formatDate(date.toISOString());
  } catch {
    return "";
  }
}
