package eligibility

type WeightRule struct{}

func (r *WeightRule) Name() string { return "weight" }

func (r *WeightRule) Evaluate(donor DonorProfile) RuleResult {
	if donor.WeightKg < 45 {
		return RuleResult{Status: NotEligible, Reason: "Berat badan minimal 45 kg", Passed: false}
	}
	return RuleResult{Status: Eligible, Passed: true}
}
