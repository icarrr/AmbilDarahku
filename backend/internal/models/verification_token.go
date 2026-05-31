package models

import "time"

type VerificationToken struct {
	ID        string     `db:"id" json:"id"`
	UserID    string     `db:"user_id" json:"user_id"`
	Token     string     `db:"token" json:"token"`
	Type      string     `db:"type" json:"type"`
	ExpiresAt time.Time  `db:"expires_at" json:"expires_at"`
	UsedAt    *time.Time `db:"used_at" json:"used_at,omitempty"`
	CreatedAt time.Time  `db:"created_at" json:"created_at"`
}
