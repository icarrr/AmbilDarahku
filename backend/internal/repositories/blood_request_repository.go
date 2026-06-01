package repositories

import (
	"fmt"
	"strings"

	"github.com/jmoiron/sqlx"

	"github.com/icarrr/ambildarahku-backend/internal/models"
)

type BloodRequestRepository struct {
	db *sqlx.DB
}

func NewBloodRequestRepository(db *sqlx.DB) *BloodRequestRepository {
	return &BloodRequestRepository{db: db}
}

func (r *BloodRequestRepository) Create(req *models.BloodRequest) error {
	query := `
		INSERT INTO blood_requests (requester_id, patient_name, hospital, blood_type, rhesus,
			bags, urgency, latitude, longitude, city, contact_phone, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, created_at, updated_at`
	return r.db.QueryRow(query,
		req.RequesterID, req.PatientName, req.Hospital, req.BloodType, req.Rhesus,
		req.Bags, req.Urgency, req.Latitude, req.Longitude, req.City,
		req.ContactPhone, req.Notes,
	).Scan(&req.ID, &req.CreatedAt, &req.UpdatedAt)
}

func (r *BloodRequestRepository) FindByID(id string) (*models.BloodRequest, error) {
	req := &models.BloodRequest{}
	err := r.db.Get(req, "SELECT * FROM blood_requests WHERE id = $1", id)
	return req, err
}

func (r *BloodRequestRepository) FindByRequesterID(requesterID string) ([]*models.BloodRequest, error) {
	var requests []*models.BloodRequest
	err := r.db.Select(&requests,
		"SELECT * FROM blood_requests WHERE requester_id = $1 ORDER BY created_at DESC", requesterID)
	return requests, err
}

func (r *BloodRequestRepository) FindOpen(filters map[string]interface{}) ([]*models.BloodRequest, error) {
	query := "SELECT * FROM blood_requests WHERE status = 'open'"
	args := []interface{}{}
	i := 1

	if bt, ok := filters["blood_type"]; ok {
		query += fmt.Sprintf(" AND blood_type = $%d", i)
		args = append(args, bt)
		i++
	}
	if urgencyStr, ok := filters["urgency"]; ok {
		parts := strings.Split(urgencyStr.(string), ",")
		placeholders := make([]string, len(parts))
		for j, p := range parts {
			placeholders[j] = fmt.Sprintf("$%d", i)
			args = append(args, strings.TrimSpace(p))
			i++
		}
		query += fmt.Sprintf(" AND urgency IN (%s)", strings.Join(placeholders, ", "))
	}

	query += " ORDER BY CASE urgency WHEN 'critical' THEN 0 WHEN 'urgent' THEN 1 ELSE 2 END, created_at DESC"

	if l, ok := filters["limit"]; ok {
		query += fmt.Sprintf(" LIMIT $%d", i)
		args = append(args, l)
		i++
	}

	var requests []*models.BloodRequest
	err := r.db.Select(&requests, query, args...)
	return requests, err
}

func (r *BloodRequestRepository) UpdateStatus(id string, status string) error {
	_, err := r.db.Exec(
		"UPDATE blood_requests SET status = $2, updated_at = NOW() WHERE id = $1",
		id, status)
	return err
}

func (r *BloodRequestRepository) AddFulfillment(id string, bags int) (int, int, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return 0, 0, err
	}
	defer tx.Rollback()

	var totalBags, fulfilledBags int
	err = tx.QueryRow("SELECT bags, fulfilled_bags FROM blood_requests WHERE id = $1 FOR UPDATE", id).
		Scan(&totalBags, &fulfilledBags)
	if err != nil {
		return 0, 0, err
	}

	newFulfilled := fulfilledBags + bags
	if newFulfilled > totalBags {
		newFulfilled = totalBags
	}

	_, err = tx.Exec("UPDATE blood_requests SET fulfilled_bags = $2, updated_at = NOW() WHERE id = $1", id, newFulfilled)
	if err != nil {
		return 0, 0, err
	}

	if newFulfilled >= totalBags {
		_, err = tx.Exec("UPDATE blood_requests SET status = 'fulfilled', updated_at = NOW() WHERE id = $1", id)
		if err != nil {
			return 0, 0, err
		}
	}

	return totalBags, newFulfilled, tx.Commit()
}
