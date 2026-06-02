package repositories

import (
	"database/sql"
	"time"

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

func (r *DonorVerificationRepository) FindByID(id string) (*models.DonorVerification, error) {
	var v models.DonorVerification
	err := r.db.Get(&v, "SELECT * FROM donor_verifications WHERE id = $1", id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &v, nil
}

func (r *DonorVerificationRepository) FindLatestByUserID(userID string, level int) (*models.DonorVerification, error) {
	var v models.DonorVerification
	err := r.db.Get(&v,
		"SELECT * FROM donor_verifications WHERE user_id = $1 AND level = $2 ORDER BY created_at DESC LIMIT 1",
		userID, level)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &v, nil
}

func (r *DonorVerificationRepository) FindPendingAll() ([]*models.DonorVerification, error) {
	var verifications []*models.DonorVerification
	err := r.db.Select(&verifications,
		"SELECT * FROM donor_verifications WHERE status = 'pending' ORDER BY created_at ASC")
	return verifications, err
}

func (r *DonorVerificationRepository) Update(id string, status string, verifierID string, notes *string) error {
	_, err := r.db.Exec(`
		UPDATE donor_verifications
		SET status = $2, verifier_id = $3, notes = COALESCE($4, notes), updated_at = NOW()
		WHERE id = $1`, id, status, verifierID, notes)
	return err
}

type VerificationWithUser struct {
	ID           string     `db:"id" json:"id"`
	UserID       string     `db:"user_id" json:"user_id"`
	Level        int        `db:"level" json:"level"`
	Status       string     `db:"status" json:"status"`
	VerifierID   *string    `db:"verifier_id" json:"verifier_id,omitempty"`
	VerifierRole string     `db:"verifier_role" json:"verifier_role"`
	Notes        *string    `db:"notes" json:"notes,omitempty"`
	CreatedAt    time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time  `db:"updated_at" json:"updated_at"`
	FullName     string     `db:"full_name" json:"full_name"`
	Email        string     `db:"email" json:"email"`
	Phone        string     `db:"phone" json:"phone"`
	BloodType    string     `db:"blood_type" json:"blood_type"`
	City         string     `db:"city" json:"city"`
	UserLevel    int        `db:"user_level" json:"user_level"`
}

func (r *DonorVerificationRepository) FindPendingWithUser() ([]*VerificationWithUser, error) {
	var verifications []*VerificationWithUser
	err := r.db.Select(&verifications, `
		SELECT v.*, u.full_name, u.email, u.phone, u.blood_type, u.city, u.verification_level AS user_level
		FROM donor_verifications v
		JOIN users u ON u.id = v.user_id
		WHERE v.status = 'pending'
		ORDER BY v.created_at ASC`)
	return verifications, err
}

type TimelineEntry struct {
	Type        string    `db:"type" json:"type"`
	ID          string    `db:"id" json:"id"`
	Title       string    `db:"title" json:"title"`
	Description string    `db:"description" json:"description"`
	Date        time.Time `db:"date" json:"date"`
	Status      string    `db:"status" json:"status"`
	Link        string    `db:"link" json:"link"`
}

func (r *DonorVerificationRepository) GetTimeline(userID string, limit, offset int) ([]*TimelineEntry, error) {
	query := `
		SELECT type, id, title, description, date, status, link FROM (
			SELECT 'donation' AS type, dh.id, dh.institution AS title, dh.location AS description, dh.donation_date AS date, dh.verification_status AS status, '/donor-history' AS link
			FROM donor_histories dh WHERE dh.user_id = $1
			UNION ALL
			SELECT 'claim' AS type, dc.id, dc.location AS title, dc.institution_name AS description, dc.donation_date AS date, dc.status, '/claims' AS link
			FROM donation_claims dc WHERE dc.user_id = $1
			UNION ALL
			SELECT 'badge' AS type, ub.id, b.name AS title, b.description AS description, ub.awarded_at AS date, 'awarded' AS status, '/profile' AS link
			FROM user_badges ub JOIN badges b ON b.id = ub.badge_id WHERE ub.user_id = $1
		) AS timeline
		ORDER BY date DESC
		LIMIT $2 OFFSET $3`
	var entries []*TimelineEntry
	err := r.db.Select(&entries, query, userID, limit, offset)
	return entries, err
}

func (r *DonorVerificationRepository) GetPublicTimeline(username string, limit, offset int) ([]*TimelineEntry, error) {
	query := `
		SELECT type, id, title, description, date, status, link FROM (
			SELECT 'donation' AS type, dh.id, dh.institution AS title, dh.location AS description, dh.donation_date AS date, dh.verification_status AS status, '' AS link
			FROM donor_histories dh JOIN users u ON u.id = dh.user_id WHERE u.username = $1
			UNION ALL
			SELECT 'badge' AS type, ub.id, b.name AS title, b.description AS description, ub.awarded_at AS date, 'awarded' AS status, '' AS link
			FROM user_badges ub JOIN badges b ON b.id = ub.badge_id JOIN users u ON u.id = ub.user_id WHERE u.username = $1
		) AS timeline
		ORDER BY date DESC
		LIMIT $2 OFFSET $3`
	var entries []*TimelineEntry
	err := r.db.Select(&entries, query, username, limit, offset)
	return entries, err
}
