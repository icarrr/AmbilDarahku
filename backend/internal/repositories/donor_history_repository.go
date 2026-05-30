package repositories

import (
	"github.com/jmoiron/sqlx"

	"github.com/icarrr/ambildarahku-backend/internal/models"
)

type DonorHistoryRepository struct {
	db *sqlx.DB
}

func NewDonorHistoryRepository(db *sqlx.DB) *DonorHistoryRepository {
	return &DonorHistoryRepository{db: db}
}

func (r *DonorHistoryRepository) Create(h *models.DonorHistory) error {
	query := `
		INSERT INTO donor_histories (user_id, donation_date, location, institution, bags, notes,
			proof_photo, proof_card, proof_letter, verification_status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, created_at`
	return r.db.QueryRow(query,
		h.UserID, h.DonationDate, h.Location, h.Institution, h.Bags,
		h.Notes, h.ProofPhoto, h.ProofCard, h.ProofLetter, h.VerificationStatus,
	).Scan(&h.ID, &h.CreatedAt)
}

func (r *DonorHistoryRepository) FindByUserID(userID string) ([]*models.DonorHistory, error) {
	var histories []*models.DonorHistory
	err := r.db.Select(&histories,
		"SELECT * FROM donor_histories WHERE user_id = $1 ORDER BY donation_date DESC", userID)
	return histories, err
}

func (r *DonorHistoryRepository) FindByID(id string) (*models.DonorHistory, error) {
	h := &models.DonorHistory{}
	err := r.db.Get(h, "SELECT * FROM donor_histories WHERE id = $1", id)
	return h, err
}

func (r *DonorHistoryRepository) UpdateVerification(id string, status string, verifiedBy string) error {
	_, err := r.db.Exec(`
		UPDATE donor_histories
		SET verification_status = $2, verified_by = $3, verified_at = NOW()
		WHERE id = $1`, id, status, verifiedBy)
	return err
}
