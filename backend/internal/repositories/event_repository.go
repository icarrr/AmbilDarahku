package repositories

import (
	"github.com/jmoiron/sqlx"

	"github.com/icarrr/ambildarahku-backend/internal/models"
)

type EventRepository struct {
	db *sqlx.DB
}

func NewEventRepository(db *sqlx.DB) *EventRepository {
	return &EventRepository{db: db}
}

func (r *EventRepository) FindUpcoming() ([]*models.Event, error) {
	var events []*models.Event
	err := r.db.Select(&events, `
		SELECT * FROM events
		WHERE status IN ('upcoming', 'ongoing')
		ORDER BY event_date ASC`)
	return events, err
}

func (r *EventRepository) Create(event *models.Event) error {
	query := `
		INSERT INTO events (title, description, location, city, event_date, start_time, end_time,
			organizer, contact_phone, quota, banner_url, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, created_at, updated_at`
	return r.db.QueryRow(query,
		event.Title, event.Description, event.Location, event.City,
		event.EventDate, event.StartTime, event.EndTime,
		event.Organizer, event.ContactPhone, event.Quota, event.BannerURL, event.Status,
	).Scan(&event.ID, &event.CreatedAt, &event.UpdatedAt)
}
