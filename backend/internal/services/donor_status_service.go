package services

import (
	"time"

	"github.com/icarrr/ambildarahku-backend/internal/repositories"
)

type DonorStatusService struct {
	userRepo *repositories.UserRepository
}

func NewDonorStatusService(userRepo *repositories.UserRepository) *DonorStatusService {
	return &DonorStatusService{userRepo: userRepo}
}

const eligibilityDays = 90

func (s *DonorStatusService) EvaluateEligibility(userID string) (string, *time.Time, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return "", nil, err
	}

	var eligibility string
	var lastDonation *time.Time

	if user.LastDonationDate == nil {
		eligibility = "eligible"
	} else {
		lastDonation = user.LastDonationDate
		daysSince := int(time.Since(*lastDonation).Hours() / 24)
		if daysSince >= eligibilityDays {
			eligibility = "eligible"
		} else {
			eligibility = "recovery"
		}
	}

	if user.EligibilityStatus != eligibility {
		user.EligibilityStatus = eligibility
		if err := s.userRepo.Update(user); err != nil {
			return "", nil, err
		}
	}

	if user.AvailabilityMode == "automatic" {
		newStatus := "available"
		if eligibility == "recovery" {
			newStatus = "temporarily_unavailable"
		}
		if user.AvailabilityStatus != newStatus {
			user.AvailabilityStatus = newStatus
			if err := s.userRepo.Update(user); err != nil {
				return "", nil, err
			}
		}
	}

	return eligibility, lastDonation, nil
}

type StatusUpdateInput struct {
	AvailabilityMode   string  `json:"availability_mode"`
	AvailabilityStatus string  `json:"availability_status"`
	ReadyAgainDate     *string `json:"ready_again_date"`
	UnavailableReason  *string `json:"unavailable_reason"`
}

func (s *DonorStatusService) UpdateStatus(userID string, input *StatusUpdateInput) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return err
	}

	if input.AvailabilityMode == "manual" {
		user.AvailabilityMode = "manual"
		user.AvailabilityStatus = input.AvailabilityStatus

		if input.AvailabilityStatus == "temporarily_unavailable" && input.ReadyAgainDate != nil {
			parsed, err := time.Parse("2006-01-02", *input.ReadyAgainDate)
			if err == nil {
				user.ReadyAgainDate = &parsed
			}
		}
		user.UnavailableReason = input.UnavailableReason
	} else if input.AvailabilityMode == "automatic" {
		user.AvailabilityMode = "automatic"
		user.ReadyAgainDate = nil
		user.UnavailableReason = nil
		s.EvaluateEligibility(userID)
	}

	return s.userRepo.Update(user)
}

type SearchPriority struct {
	UserID   string `json:"user_id"`
	Priority int    `json:"priority"`
}

func (s *DonorStatusService) GetSearchPriority(userID string) int {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return 4
	}

	if user.EligibilityStatus == "eligible" && user.AvailabilityStatus == "available" {
		return 1
	}

	if user.EligibilityStatus == "eligible" && user.ReadyAgainDate != nil {
		daysUntil := int(time.Until(*user.ReadyAgainDate).Hours() / 24)
		if daysUntil <= 3 {
			return 2
		}
		if daysUntil <= 7 {
			return 3
		}
	}

	return 4
}
