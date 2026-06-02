package models

import "time"

type DonorPassport struct {
	ID             string     `db:"id" json:"id"`
	UserID         string     `db:"user_id" json:"user_id"`
	PassportNumber string     `db:"passport_number" json:"passport_number"`
	QrToken        string     `db:"qr_token" json:"qr_token"`
	IssuedAt       time.Time  `db:"issued_at" json:"issued_at"`
	LastRenewedAt  *time.Time `db:"last_renewed_at" json:"last_renewed_at,omitempty"`
	IsActive       bool       `db:"is_active" json:"is_active"`
	CreatedAt      time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt      time.Time  `db:"updated_at" json:"updated_at"`
}
