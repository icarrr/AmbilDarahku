export type EligibilityStatus = "eligible" | "not_eligible" | "waiting_period" | "needs_clearance";

export interface DonorProfile {
  dateOfBirth: string;
  totalDonations: number;
  weightKg: number;
  lastDonationDate: string | null;
}

export interface RuleResult {
  rule: string;
  status: EligibilityStatus;
  reason: string;
  passed: boolean;
}

function ageRule(donor: DonorProfile): RuleResult {
  const birth = new Date(donor.dateOfBirth);
  const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 86400000));

  if (age < 18) {
    return { rule: "age", status: "not_eligible", reason: "Usia minimal 18 tahun", passed: false };
  }
  if (age > 65) {
    return { rule: "age", status: "not_eligible", reason: "Usia maksimal 65 tahun", passed: false };
  }
  return { rule: "age", status: "eligible", reason: "", passed: true };
}

function weightRule(donor: DonorProfile): RuleResult {
  if (donor.weightKg < 50) {
    return { rule: "weight", status: "not_eligible", reason: "Berat badan minimal 50 kg", passed: false };
  }
  return { rule: "weight", status: "eligible", reason: "", passed: true };
}

function intervalRule(donor: DonorProfile): RuleResult {
  if (!donor.lastDonationDate) {
    return { rule: "donation_interval", status: "eligible", reason: "", passed: true };
  }
  const last = new Date(donor.lastDonationDate);
  const daysSince = Math.floor((Date.now() - last.getTime()) / 86400000);
  const minInterval = 56;

  if (daysSince < minInterval) {
    const remaining = minInterval - daysSince;
    return {
      rule: "donation_interval",
      status: "waiting_period",
      reason: `Jeda donor minimal ${minInterval} hari. Masih ${remaining} hari lagi.`,
      passed: false,
    };
  }
  return { rule: "donation_interval", status: "eligible", reason: "", passed: true };
}

export function evaluateEligibility(donor: DonorProfile): { status: EligibilityStatus; results: RuleResult[] } {
  const rules = [ageRule, weightRule, intervalRule];
  const results = rules.map((r) => r(donor));
  let overall: EligibilityStatus = "eligible";

  for (const r of results) {
    if (r.status === "not_eligible") {
      overall = "not_eligible";
    } else if (r.status === "waiting_period" && overall !== "not_eligible") {
      overall = "waiting_period";
    } else if (r.status === "needs_clearance" && overall === "eligible") {
      overall = "needs_clearance";
    }
  }

  if (overall === "needs_clearance") {
    results.push({
      rule: "medical_clearance",
      status: "needs_clearance",
      reason: "Usia di atas 65 tahun memerlukan surat izin dokter untuk dapat mendonor",
      passed: true,
    });
  }

  return { status: overall, results };
}

export function getSearchPriority(eligibilityStatus: string, availabilityStatus: string, readyAgainDate: string | null): number {
  if (eligibilityStatus === "eligible" && availabilityStatus === "available") {
    return 1;
  }
  if (eligibilityStatus === "eligible" && readyAgainDate) {
    const daysUntil = Math.ceil((new Date(readyAgainDate).getTime() - Date.now()) / 86400000);
    if (daysUntil <= 3) return 2;
    if (daysUntil <= 7) return 3;
  }
  return 4;
}

export function calculateDonationVolume(_weightKg: number): number {
  return 0.45;
}
