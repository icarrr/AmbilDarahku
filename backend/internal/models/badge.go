package models

import "time"

type Badge struct {
	ID           string    `db:"id" json:"id"`
	Name         string    `db:"name" json:"name"`
	Description  *string   `db:"description" json:"description,omitempty"`
	IconURL      *string   `db:"icon_url" json:"icon_url,omitempty"`
	MinDonations int       `db:"min_donations" json:"min_donations"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
}

type UserBadge struct {
	ID        string    `db:"id" json:"id"`
	UserID    string    `db:"user_id" json:"user_id"`
	BadgeID   string    `db:"badge_id" json:"badge_id"`
	AwardedAt time.Time `db:"awarded_at" json:"awarded_at"`
	Badge     *Badge    `db:"-" json:"badge,omitempty"`
}
