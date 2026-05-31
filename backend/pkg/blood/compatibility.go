package blood

type BloodType string

const (
	ONegative BloodType = "O-"
	OPositive BloodType = "O+"
	ANegative BloodType = "A-"
	APositive BloodType = "A+"
	BNegative BloodType = "B-"
	BPositive BloodType = "B+"
	ABNegative BloodType = "AB-"
	ABPositive BloodType = "AB+"
)

var canReceiveFrom = map[BloodType][]BloodType{
	ONegative: {ONegative},
	OPositive: {ONegative, OPositive},
	ANegative: {ONegative, ANegative},
	APositive: {ONegative, OPositive, ANegative, APositive},
	BNegative: {ONegative, BNegative},
	BPositive: {ONegative, OPositive, BNegative, BPositive},
	ABNegative: {ONegative, ANegative, BNegative, ABNegative},
	ABPositive: {ONegative, OPositive, ANegative, APositive, BNegative, BPositive, ABNegative, ABPositive},
}

var canDonateTo = map[BloodType][]BloodType{
	ONegative: {ONegative, OPositive, ANegative, APositive, BNegative, BPositive, ABNegative, ABPositive},
	OPositive: {OPositive, APositive, BPositive, ABPositive},
	ANegative: {ANegative, APositive, ABNegative, ABPositive},
	APositive: {APositive, ABPositive},
	BNegative: {BNegative, BPositive, ABNegative, ABPositive},
	BPositive: {BPositive, ABPositive},
	ABNegative: {ABNegative, ABPositive},
	ABPositive: {ABPositive},
}

var allTypes = []BloodType{ONegative, OPositive, ANegative, APositive, BNegative, BPositive, ABNegative, ABPositive}

func Parse(s string) (BloodType, bool) {
	for _, t := range allTypes {
		if string(t) == s {
			return t, true
		}
	}
	return "", false
}

func CanDonateTo(donor, recipient BloodType) bool {
	for _, t := range canDonateTo[donor] {
		if t == recipient {
			return true
		}
	}
	return false
}

func CanReceiveFrom(recipient BloodType) []BloodType {
	return canReceiveFrom[recipient]
}

func CanDonateToTypes(donor BloodType) []BloodType {
	return canDonateTo[donor]
}

func CompatibleDonorsFor(recipient BloodType) []BloodType {
	return canReceiveFrom[recipient]
}
