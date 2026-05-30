package models

import "time"

type BloodRequest struct {
	ID           string    `db:"id" json:"id"`
	RequesterID  string    `db:"requester_id" json:"requester_id"`
	PatientName  string    `db:"patient_name" json:"patient_name"`
	Hospital     string    `db:"hospital" json:"hospital"`
	BloodType    string    `db:"blood_type" json:"blood_type"`
	Rhesus       string    `db:"rhesus" json:"rhesus"`
	Bags         int       `db:"bags" json:"bags"`
	Urgency      string    `db:"urgency" json:"urgency"`
	Latitude     float64   `db:"latitude" json:"latitude"`
	Longitude    float64   `db:"longitude" json:"longitude"`
	City         string    `db:"city" json:"city"`
	ContactPhone string    `db:"contact_phone" json:"contact_phone"`
	Notes        *string   `db:"notes" json:"notes,omitempty"`
	Status       string    `db:"status" json:"status"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time `db:"updated_at" json:"updated_at"`
}
