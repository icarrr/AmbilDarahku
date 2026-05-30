package models

import "time"

type DonorHistory struct {
	ID                 string     `db:"id" json:"id"`
	UserID             string     `db:"user_id" json:"user_id"`
	DonationDate       time.Time  `db:"donation_date" json:"donation_date"`
	Location           string     `db:"location" json:"location"`
	Institution        string     `db:"institution" json:"institution"`
	Bags               int        `db:"bags" json:"bags"`
	Notes              *string    `db:"notes" json:"notes,omitempty"`
	ProofPhoto         *string    `db:"proof_photo" json:"proof_photo,omitempty"`
	ProofCard          *string    `db:"proof_card" json:"proof_card,omitempty"`
	ProofLetter        *string    `db:"proof_letter" json:"proof_letter,omitempty"`
	VerificationStatus string     `db:"verification_status" json:"verification_status"`
	VerifiedBy         *string    `db:"verified_by" json:"verified_by,omitempty"`
	VerifiedAt         *time.Time `db:"verified_at" json:"verified_at,omitempty"`
	CreatedAt          time.Time  `db:"created_at" json:"created_at"`
}
