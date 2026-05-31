package repositories

import (
	"github.com/jmoiron/sqlx"

	"github.com/icarrr/ambildarahku-backend/internal/models"
)

type FulfillmentRepository struct {
	db *sqlx.DB
}

func NewFulfillmentRepository(db *sqlx.DB) *FulfillmentRepository {
	return &FulfillmentRepository{db: db}
}

func (r *FulfillmentRepository) Create(f *models.RequestFulfillment) error {
	query := `
		INSERT INTO request_fulfillments (request_id, donor_id, bags)
		VALUES ($1, $2, $3)
		RETURNING id, created_at`
	return r.db.QueryRow(query, f.RequestID, f.DonorID, f.Bags).Scan(&f.ID, &f.CreatedAt)
}

func (r *FulfillmentRepository) FindByRequestID(requestID string) ([]*models.RequestFulfillment, error) {
	var fulfillments []*models.RequestFulfillment
	err := r.db.Select(&fulfillments, `
		SELECT rf.*, u.full_name AS donor_name
		FROM request_fulfillments rf
		JOIN users u ON u.id = rf.donor_id
		WHERE rf.request_id = $1
		ORDER BY rf.created_at DESC`, requestID)
	return fulfillments, err
}
