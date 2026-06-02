package models

import "time"

type User struct {
	ID                  string     `db:"id" json:"id"`
	FullName            string     `db:"full_name" json:"full_name"`
	Phone               string     `db:"phone" json:"phone"`
	Email               string     `db:"email" json:"email"`
	PasswordHash        string     `db:"password_hash" json:"-"`
	Role                string     `db:"role" json:"role"`
	DateOfBirth         time.Time  `db:"date_of_birth" json:"date_of_birth"`
	Gender              string     `db:"gender" json:"gender"`
	BloodType           string     `db:"blood_type" json:"blood_type"`
	Rhesus              string     `db:"rhesus" json:"rhesus"`
	WeightKg            float64    `db:"weight_kg" json:"weight_kg"`
	HeightCm            float64    `db:"height_cm" json:"height_cm"`
	Province            string     `db:"province" json:"province"`
	City                string     `db:"city" json:"city"`
	District            string     `db:"district" json:"district"`
	Latitude            float64    `db:"latitude" json:"latitude"`
	Longitude           float64    `db:"longitude" json:"longitude"`
	Username            *string    `db:"username" json:"username,omitempty"`
	AvatarURL           *string    `db:"avatar_url" json:"avatar_url,omitempty"`
	AvailabilityMode    string     `db:"availability_mode" json:"availability_mode"`
	AvailabilityStatus  string     `db:"availability_status" json:"availability_status"`
	ReadyAgainDate      *time.Time `db:"ready_again_date" json:"ready_again_date,omitempty"`
	UnavailableReason   *string    `db:"unavailable_reason" json:"unavailable_reason,omitempty"`
	TotalDonations      int        `db:"total_donations" json:"total_donations"`
	LastDonationDate    *time.Time `db:"last_donation_date" json:"last_donation_date,omitempty"`
	EligibilityStatus   string     `db:"eligibility_status" json:"eligibility_status"`
	TotalPoints         int        `db:"total_points" json:"total_points"`
	EmailVerified       bool       `db:"email_verified" json:"email_verified"`
	NationalDonorID     *string    `db:"national_donor_id" json:"national_donor_id,omitempty"`
	DonationVolumeTotal float64    `db:"donation_volume_total" json:"donation_volume_total"`
	VerificationLevel   int        `db:"verification_level" json:"verification_level"`
	TrustScore          float64    `db:"trust_score" json:"trust_score"`
	CreatedAt           time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt           time.Time  `db:"updated_at" json:"updated_at"`
}
