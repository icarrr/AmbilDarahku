const compatibility: Record<string, string[]> = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

export function compatibleDonorsFor(bloodType: string): string[] {
  return compatibility[bloodType] || [];
}

export function canDonateTo(donorType: string, recipientType: string): boolean {
  return compatibleDonorsFor(recipientType).includes(donorType);
}
