package eligibility

import "time"

type Status string

const (
	Eligible       Status = "eligible"
	NotEligible    Status = "not_eligible"
	WaitingPeriod  Status = "waiting_period"
	NeedsClearance Status = "needs_clearance"
)

type DonorProfile struct {
	DateOfBirth      time.Time
	TotalDonations   int
	WeightKg         float64
	LastDonationDate *time.Time
	Hemoglobin       *float64
	BloodPressureOK  *bool
	IsIll            *bool
}

type RuleResult struct {
	Status  Status `json:"status"`
	Reason  string `json:"reason"`
	Passed  bool   `json:"passed"`
	Rule    string `json:"rule"`
}

type Rule interface {
	Name() string
	Evaluate(donor DonorProfile) RuleResult
}

type Engine struct {
	rules []Rule
}

func NewEngine() *Engine {
	return &Engine{
		rules: []Rule{
			&AgeRule{},
			&WeightRule{},
			&DonationIntervalRule{},
		},
	}
}

func (e *Engine) Evaluate(donor DonorProfile) (Status, []RuleResult) {
	overall := Eligible
	results := make([]RuleResult, 0, len(e.rules))

	for _, rule := range e.rules {
		result := rule.Evaluate(donor)
		result.Rule = rule.Name()
		results = append(results, result)

		switch result.Status {
		case NotEligible:
			overall = NotEligible
		case WaitingPeriod:
			if overall != NotEligible {
				overall = WaitingPeriod
			}
		case NeedsClearance:
			if overall == Eligible {
				overall = NeedsClearance
			}
		}
	}

	if overall == NeedsClearance {
		results = append(results, RuleResult{
			Status:  NeedsClearance,
			Reason:  "Usia di atas 60 tahun memerlukan surat izin dokter untuk dapat mendonor",
			Passed:  true,
			Rule:    "medical_clearance",
		})
	}

	return overall, results
}
