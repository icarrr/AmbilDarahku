package models

import "time"

type DonorVerification struct {
	ID           string    `db:"id" json:"id"`
	UserID       string    `db:"user_id" json:"user_id"`
	Level        int       `db:"level" json:"level"`
	Status       string    `db:"status" json:"status"`
	VerifierID   *string   `db:"verifier_id" json:"verifier_id,omitempty"`
	VerifierRole string    `db:"verifier_role" json:"verifier_role"`
	Notes        *string   `db:"notes" json:"notes,omitempty"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time `db:"updated_at" json:"updated_at"`
}
