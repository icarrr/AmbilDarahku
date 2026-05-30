package repositories

import (
	"github.com/jmoiron/sqlx"

	"github.com/icarrr/ambildarahku-backend/internal/models"
)

type DonorVerificationRepository struct {
	db *sqlx.DB
}

func NewDonorVerificationRepository(db *sqlx.DB) *DonorVerificationRepository {
	return &DonorVerificationRepository{db: db}
}

func (r *DonorVerificationRepository) Create(v *models.DonorVerification) error {
	query := `
		INSERT INTO donor_verifications (user_id, level, status, verifier_id, verifier_role, notes)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at`
	return r.db.QueryRow(query,
		v.UserID, v.Level, v.Status, v.VerifierID, v.VerifierRole, v.Notes,
	).Scan(&v.ID, &v.CreatedAt, &v.UpdatedAt)
}

func (r *DonorVerificationRepository) FindByUserID(userID string) ([]*models.DonorVerification, error) {
	var verifications []*models.DonorVerification
	err := r.db.Select(&verifications,
		"SELECT * FROM donor_verifications WHERE user_id = $1 ORDER BY level", userID)
	return verifications, err
}

func (r *DonorVerificationRepository) Update(id string, status string, verifierID string, notes *string) error {
	_, err := r.db.Exec(`
		UPDATE donor_verifications
		SET status = $2, verifier_id = $3, notes = COALESCE($4, notes), updated_at = NOW()
		WHERE id = $1`, id, status, verifierID, notes)
	return err
}
