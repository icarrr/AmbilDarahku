package eligibility

import "time"

type AgeRule struct{}

func (r *AgeRule) Name() string { return "age" }

func (r *AgeRule) Evaluate(donor DonorProfile) RuleResult {
	age := int(time.Since(donor.DateOfBirth).Hours() / 24 / 365)

	if donor.TotalDonations == 0 {
		if age < 17 {
			return RuleResult{Status: NotEligible, Reason: "Usia minimal 17 tahun untuk donor perdana", Passed: false}
		}
		if age > 60 {
			return RuleResult{Status: NotEligible, Reason: "Usia maksimal 60 tahun untuk donor perdana", Passed: false}
		}
		return RuleResult{Status: Eligible, Passed: true}
	}

	if age > 65 {
		return RuleResult{Status: NotEligible, Reason: "Usia maksimal 65 tahun untuk donor ulang", Passed: false}
	}
	if age > 60 {
		return RuleResult{Status: NeedsClearance, Passed: true}
	}

	return RuleResult{Status: Eligible, Passed: true}
}
