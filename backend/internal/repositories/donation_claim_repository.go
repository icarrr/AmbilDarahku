package repositories

import (
	"time"

	"github.com/jmoiron/sqlx"

	"github.com/icarrr/ambildarahku-backend/internal/models"
)

type ClaimWithUser struct {
	ID              string     `db:"id" json:"id"`
	UserID          string     `db:"user_id" json:"user_id"`
	DonationDate    time.Time  `db:"donation_date" json:"donation_date"`
	Location        string     `db:"location" json:"location"`
	InstitutionName string     `db:"institution_name" json:"institution_name"`
	BloodType       string     `db:"blood_type" json:"blood_type"`
	VolumeMl        int        `db:"volume_ml" json:"volume_ml"`
	ProofPhotoURL   *string    `db:"proof_photo_url" json:"proof_photo_url,omitempty"`
	ProofDocumentURL *string   `db:"proof_document_url" json:"proof_document_url,omitempty"`
	AdditionalNotes *string    `db:"additional_notes" json:"additional_notes,omitempty"`
	Status          string     `db:"status" json:"status"`
	ReviewedBy      *string    `db:"reviewed_by" json:"reviewed_by,omitempty"`
	ReviewedAt      *time.Time `db:"reviewed_at" json:"reviewed_at,omitempty"`
	RejectionReason *string    `db:"rejection_reason" json:"rejection_reason,omitempty"`
	CreatedAt       time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt       time.Time  `db:"updated_at" json:"updated_at"`
	FullName        string     `db:"full_name" json:"full_name"`
	Email           string     `db:"email" json:"email"`
	Phone           string     `db:"phone" json:"phone"`
	DonorBloodType  string     `db:"donor_blood_type" json:"donor_blood_type"`
	DonorCity       string     `db:"donor_city" json:"donor_city"`
}

type DonationClaimRepository struct {
	db *sqlx.DB
}

func NewDonationClaimRepository(db *sqlx.DB) *DonationClaimRepository {
	return &DonationClaimRepository{db: db}
}

func (r *DonationClaimRepository) Create(c *models.DonationClaim) error {
	query := `
		INSERT INTO donation_claims (
			user_id, donation_date, location, institution_name, blood_type,
			volume_ml, proof_photo_url, proof_document_url, additional_notes, status
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, created_at, updated_at`
	return r.db.QueryRow(query,
		c.UserID, c.DonationDate, c.Location, c.InstitutionName, c.BloodType,
		c.VolumeMl, c.ProofPhotoURL, c.ProofDocumentURL, c.AdditionalNotes, c.Status,
	).Scan(&c.ID, &c.CreatedAt, &c.UpdatedAt)
}

func (r *DonationClaimRepository) FindByUserID(userID string) ([]*models.DonationClaim, error) {
	var claims []*models.DonationClaim
	err := r.db.Select(&claims,
		"SELECT * FROM donation_claims WHERE user_id = $1 ORDER BY created_at DESC", userID)
	return claims, err
}

func (r *DonationClaimRepository) FindByID(id string) (*models.DonationClaim, error) {
	var c models.DonationClaim
	err := r.db.Get(&c, "SELECT * FROM donation_claims WHERE id = $1", id)
	return &c, err
}

func (r *DonationClaimRepository) FindPendingWithUser() ([]*ClaimWithUser, error) {
	var claims []*ClaimWithUser
	err := r.db.Select(&claims, `
		SELECT c.*, u.full_name, u.email, u.phone,
			u.blood_type AS donor_blood_type, u.city AS donor_city
		FROM donation_claims c
		JOIN users u ON u.id = c.user_id
		WHERE c.status = 'pending'
		ORDER BY c.created_at DESC`)
	return claims, err
}

func (r *DonationClaimRepository) FindAllByStatus(status string) ([]*models.DonationClaim, error) {
	var claims []*models.DonationClaim
	err := r.db.Select(&claims,
		"SELECT * FROM donation_claims WHERE status = $1 ORDER BY created_at DESC", status)
	return claims, err
}

func (r *DonationClaimRepository) UpdateStatus(id, status string, reviewedBy *string, rejectionReason *string) error {
	_, err := r.db.Exec(`
		UPDATE donation_claims SET
			status = $2,
			reviewed_by = $3,
			reviewed_at = NOW(),
			rejection_reason = $4,
			updated_at = NOW()
		WHERE id = $1`, id, status, reviewedBy, rejectionReason)
	return err
}

func (r *DonationClaimRepository) Update(c *models.DonationClaim) error {
	_, err := r.db.Exec(`
		UPDATE donation_claims SET
			donation_date = $2, location = $3, institution_name = $4,
			blood_type = $5, volume_ml = $6,
			proof_photo_url = $7, proof_document_url = $8,
			additional_notes = $9, updated_at = NOW()
		WHERE id = $1 AND status = 'pending'`,
		c.ID, c.DonationDate, c.Location, c.InstitutionName, c.BloodType,
		c.VolumeMl, c.ProofPhotoURL, c.ProofDocumentURL, c.AdditionalNotes)
	return err
}

func (r *DonationClaimRepository) Delete(id string, userID string) error {
	_, err := r.db.Exec(
		"DELETE FROM donation_claims WHERE id = $1 AND user_id = $2 AND status = 'pending'",
		id, userID)
	return err
}
