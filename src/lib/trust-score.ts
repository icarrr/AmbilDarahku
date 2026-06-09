export interface TrustBreakdown {
  overall: number;
  donation_count: number;
  verification_level: number;
  claim_accuracy: number;
  profile_complete: number;
  account_age: number;
}

export interface TrustInput {
  totalDonations: number;
  verificationLevel: number;
  totalClaims: number;
  approvedClaims: number;
  profileFields: number;
  accountAgeDays: number;
}

export function calculateTrustScore(input: TrustInput): TrustBreakdown {
  const donationScore = Math.min((input.totalDonations / 50) * 100, 100);
  const verifScore = (input.verificationLevel / 3) * 100;
  const claimScore = input.totalClaims > 0
    ? (input.approvedClaims / input.totalClaims) * 100
    : 100;
  const profileScore = (input.profileFields / 5) * 100;
  const ageScore = Math.min((input.accountAgeDays / 730) * 100, 100);

  const overall =
    donationScore * 0.30 +
    verifScore * 0.30 +
    claimScore * 0.20 +
    profileScore * 0.10 +
    ageScore * 0.10;

  return {
    overall: Math.round(overall * 100) / 100,
    donation_count: Math.round(donationScore * 100) / 100,
    verification_level: Math.round(verifScore * 100) / 100,
    claim_accuracy: Math.round(claimScore * 100) / 100,
    profile_complete: Math.round(profileScore * 100) / 100,
    account_age: Math.round(ageScore * 100) / 100,
  };
}
