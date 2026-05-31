package models

import "time"

type Event struct {
	ID           string    `db:"id" json:"id"`
	Title        string    `db:"title" json:"title"`
	Description  *string   `db:"description" json:"description,omitempty"`
	Location     string    `db:"location" json:"location"`
	City         string    `db:"city" json:"city"`
	EventDate    time.Time `db:"event_date" json:"event_date"`
	StartTime    string    `db:"start_time" json:"start_time"`
	EndTime      string    `db:"end_time" json:"end_time"`
	Organizer    *string   `db:"organizer" json:"organizer,omitempty"`
	ContactPhone *string   `db:"contact_phone" json:"contact_phone,omitempty"`
	Quota        int       `db:"quota" json:"quota"`
	BannerURL    *string   `db:"banner_url" json:"banner_url,omitempty"`
	Status       string    `db:"status" json:"status"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time `db:"updated_at" json:"updated_at"`
}
