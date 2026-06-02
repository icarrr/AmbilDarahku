package models

import "time"

type DonationClaim struct {
	ID               string     `db:"id" json:"id"`
	UserID           string     `db:"user_id" json:"user_id"`
	DonationDate     time.Time  `db:"donation_date" json:"donation_date"`
	Location         string     `db:"location" json:"location"`
	InstitutionName  string     `db:"institution_name" json:"institution_name"`
	BloodType        string     `db:"blood_type" json:"blood_type"`
	VolumeMl         int        `db:"volume_ml" json:"volume_ml"`
	ProofPhotoURL    *string    `db:"proof_photo_url" json:"proof_photo_url,omitempty"`
	ProofDocumentURL *string    `db:"proof_document_url" json:"proof_document_url,omitempty"`
	AdditionalNotes  *string    `db:"additional_notes" json:"additional_notes,omitempty"`
	Status           string     `db:"status" json:"status"`
	ReviewedBy       *string    `db:"reviewed_by" json:"reviewed_by,omitempty"`
	ReviewedAt       *time.Time `db:"reviewed_at" json:"reviewed_at,omitempty"`
	RejectionReason  *string    `db:"rejection_reason" json:"rejection_reason,omitempty"`
	CreatedAt        time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt        time.Time  `db:"updated_at" json:"updated_at"`
}
