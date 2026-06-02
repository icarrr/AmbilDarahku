package repositories

import (
	"github.com/jmoiron/sqlx"

	"github.com/icarrr/ambildarahku-backend/internal/models"
)

type DonorPassportRepository struct {
	db *sqlx.DB
}

func NewDonorPassportRepository(db *sqlx.DB) *DonorPassportRepository {
	return &DonorPassportRepository{db: db}
}

func (r *DonorPassportRepository) Create(p *models.DonorPassport) error {
	query := `
		INSERT INTO donor_passports (user_id, passport_number, qr_token, issued_at, is_active)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at`
	return r.db.QueryRow(query,
		p.UserID, p.PassportNumber, p.QrToken, p.IssuedAt, p.IsActive,
	).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)
}

func (r *DonorPassportRepository) FindByUserID(userID string) (*models.DonorPassport, error) {
	var p models.DonorPassport
	err := r.db.Get(&p, "SELECT * FROM donor_passports WHERE user_id = $1", userID)
	return &p, err
}

func (r *DonorPassportRepository) FindByQRToken(token string) (*models.DonorPassport, error) {
	var p models.DonorPassport
	err := r.db.Get(&p, "SELECT * FROM donor_passports WHERE qr_token = $1", token)
	return &p, err
}

func (r *DonorPassportRepository) FindByPassportNumber(number string) (*models.DonorPassport, error) {
	var p models.DonorPassport
	err := r.db.Get(&p, "SELECT * FROM donor_passports WHERE passport_number = $1", number)
	return &p, err
}

func (r *DonorPassportRepository) Update(p *models.DonorPassport) error {
	_, err := r.db.Exec(`
		UPDATE donor_passports SET
			last_renewed_at = $2,
			is_active = $3,
			updated_at = NOW()
		WHERE id = $1`, p.ID, p.LastRenewedAt, p.IsActive)
	return err
}
