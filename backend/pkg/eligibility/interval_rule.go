package eligibility

import (
	"fmt"
	"time"
)

const minDonationIntervalDays = 56

type DonationIntervalRule struct{}

func (r *DonationIntervalRule) Name() string { return "donation_interval" }

func (r *DonationIntervalRule) Evaluate(donor DonorProfile) RuleResult {
	if donor.LastDonationDate == nil {
		return RuleResult{Status: Eligible, Passed: true}
	}

	daysSince := int(time.Since(*donor.LastDonationDate).Hours() / 24)

	if daysSince < minDonationIntervalDays {
		remaining := minDonationIntervalDays - daysSince
		return RuleResult{
			Status: WaitingPeriod,
			Reason: fmt.Sprintf("Jeda donor minimal %d hari. Masih %d hari lagi.", minDonationIntervalDays, remaining),
			Passed: false,
		}
	}

	return RuleResult{Status: Eligible, Passed: true}
}
