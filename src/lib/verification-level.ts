// Shared display text for donor verification levels (users.verification_level, 0–3)
// and verifier roles / donor-history verification sources ("self", "community", "pmi", ...).

export const MAX_VERIFICATION_LEVEL = 3;

const LEVEL_LABEL: Record<number, string> = {
  0: "Belum terverifikasi",
  1: "Laporan Mandiri",
  2: "Terverifikasi Komunitas",
  3: "Terverifikasi PMI",
};

const LEVEL_DESCRIPTION: Record<number, string> = {
  0: "Belum terverifikasi",
  1: "Laporan mandiri — riwayat donor dicatat sendiri",
  2: "Terverifikasi komunitas — dikonfirmasi oleh sesama donor",
  3: "Terverifikasi PMI — diverifikasi oleh petugas PMI/rumah sakit",
};

/** Short label, e.g. "Terverifikasi Komunitas". */
export function verificationLevelLabel(level: number | null | undefined): string {
  return LEVEL_LABEL[level ?? 0] ?? `Level ${level}`;
}

/** Longer explanation of what a level means. */
export function verificationLevelDescription(level: number | null | undefined): string {
  return LEVEL_DESCRIPTION[level ?? 0] ?? `Level ${level}`;
}

const ROLE_LABEL: Record<string, string> = {
  self: "Mandiri",
  community: "Komunitas",
  pmi: "PMI",
  hospital: "Rumah Sakit",
};

/** Verifier role / verification source label; unknown values are returned as-is. */
export function verifierRoleLabel(role: string | null | undefined): string {
  if (!role) return "—";
  return ROLE_LABEL[role.toLowerCase()] ?? role;
}
