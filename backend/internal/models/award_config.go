package models

import "time"

type AwardConfig struct {
	ID          string    `db:"id" json:"id"`
	Name        string    `db:"name" json:"name"`
	Description *string   `db:"description" json:"description,omitempty"`
	AwardType   string    `db:"award_type" json:"award_type"`
	Criteria    string    `db:"criteria" json:"criteria"`
	Scope       string    `db:"scope" json:"scope"`
	ScopeValue  *string   `db:"scope_value" json:"scope_value,omitempty"`
	IsActive    bool      `db:"is_active" json:"is_active"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time `db:"updated_at" json:"updated_at"`
}

type UserTitle struct {
	ID          string    `db:"id" json:"id"`
	UserID      string    `db:"user_id" json:"user_id"`
	Title       string    `db:"title" json:"title"`
	AwardedAt   time.Time `db:"awarded_at" json:"awarded_at"`
	Source      string    `db:"source" json:"source"`
	ConfigID    *string   `db:"config_id" json:"config_id,omitempty"`
	Description *string   `db:"description" json:"description,omitempty"`
}
