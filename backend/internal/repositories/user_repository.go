package repositories

import (
	"database/sql"
	"errors"

	"github.com/jmoiron/sqlx"

	"github.com/icarrr/ambildarahku-backend/internal/models"
)

type UserRepository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *models.User) error {
	query := `
		INSERT INTO users (
			full_name, phone, email, password_hash, role,
			date_of_birth, gender, blood_type, rhesus,
			weight_kg, height_cm, province, city, district,
			latitude, longitude, username, email_verified
		)
		VALUES (
			$1, $2, $3, $4, $5,
			$6, $7, $8, $9,
			$10, $11, $12, $13, $14,
			$15, $16, $17, $18
		)
		RETURNING id, created_at, updated_at
	`

	return r.db.QueryRow(
		query,
		user.FullName,
		user.Phone,
		user.Email,
		user.PasswordHash,
		user.Role,
		user.DateOfBirth,
		user.Gender,
		user.BloodType,
		user.Rhesus,
		user.WeightKg,
		user.HeightCm,
		user.Province,
		user.City,
		user.District,
		user.Latitude,
		user.Longitude,
		user.Username,
		user.EmailVerified,
	).Scan(
		&user.ID,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
}

func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	var user models.User

	err := r.db.Get(
		&user,
		"SELECT * FROM users WHERE email = $1",
		email,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) FindByPhone(phone string) (*models.User, error) {
	var user models.User

	err := r.db.Get(
		&user,
		"SELECT * FROM users WHERE phone = $1",
		phone,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) FindByID(id string) (*models.User, error) {
	var user models.User

	err := r.db.Get(
		&user,
		"SELECT * FROM users WHERE id = $1",
		id,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) FindByUsername(username string) (*models.User, error) {
	var user models.User

	err := r.db.Get(
		&user,
		"SELECT * FROM users WHERE username = $1",
		username,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) Update(user *models.User) error {
	query := `
		UPDATE users
		SET
			full_name=$2,
			phone=$3,
			email=$4,
			role=$5,
			date_of_birth=$6,
			gender=$7,
			blood_type=$8,
			rhesus=$9,
			weight_kg=$10,
			height_cm=$11,
			province=$12,
			city=$13,
			district=$14,
			latitude=$15,
			longitude=$16,
			username=$17,
			avatar_url=$18,
			availability_mode=$19,
			availability_status=$20,
			ready_again_date=$21,
			unavailable_reason=$22,
			total_donations=$23,
			last_donation_date=$24,
			eligibility_status=$25,
			total_points=$26,
			updated_at=NOW()
		WHERE id=$1
	`

	_, err := r.db.Exec(
		query,
		user.ID,
		user.FullName,
		user.Phone,
		user.Email,
		user.Role,
		user.DateOfBirth,
		user.Gender,
		user.BloodType,
		user.Rhesus,
		user.WeightKg,
		user.HeightCm,
		user.Province,
		user.City,
		user.District,
		user.Latitude,
		user.Longitude,
		user.Username,
		user.AvatarURL,
		user.AvailabilityMode,
		user.AvailabilityStatus,
		user.ReadyAgainDate,
		user.UnavailableReason,
		user.TotalDonations,
		user.LastDonationDate,
		user.EligibilityStatus,
		user.TotalPoints,
	)

	return err
}

func (r *UserRepository) FindAll() ([]*models.User, error) {
	var users []*models.User

	err := r.db.Select(
		&users,
		"SELECT * FROM users ORDER BY created_at DESC",
	)

	return users, err
}

func (r *UserRepository) UpdatePassword(userID, newHash string) error {
	_, err := r.db.Exec("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", newHash, userID)
	return err
}

func (r *UserRepository) UpdateEmailVerified(userID string, verified bool) error {
	_, err := r.db.Exec("UPDATE users SET email_verified = $1, updated_at = NOW() WHERE id = $2", verified, userID)
	return err
}

func (r *UserRepository) Rebind(query string) string {
	return r.db.Rebind(query)
}

func (r *UserRepository) Select(dest interface{}, query string, args ...interface{}) error {
	return r.db.Select(dest, query, args...)
}

func (r *UserRepository) RefreshDonationStats(userID string) error {
	_, err := r.db.Exec(`
		UPDATE users SET
			total_donations   = COALESCE((SELECT SUM(bags) FROM donor_histories WHERE user_id = $1), 0),
			total_points      = COALESCE((SELECT SUM(bags) * 10 FROM donor_histories WHERE user_id = $1), 0),
			last_donation_date = (SELECT MAX(donation_date) FROM donor_histories WHERE user_id = $1),
			eligibility_status = CASE
				WHEN (SELECT MAX(donation_date) FROM donor_histories WHERE user_id = $1) IS NULL THEN 'eligible'
				WHEN (SELECT MAX(donation_date) FROM donor_histories WHERE user_id = $1) <= CURRENT_DATE - INTERVAL '56 days' THEN 'eligible'
				ELSE 'waiting_period'
			END,
			updated_at = NOW()
		WHERE id = $1`, userID)
	return err
}

func (r *UserRepository) Search(filters map[string]interface{}) ([]*models.User, error) {
	query := "SELECT * FROM users WHERE 1=1"
	args := []interface{}{}

	if bt, ok := filters["blood_type"]; ok {
		query += " AND blood_type = ?"
		args = append(args, bt)
	}

	if rh, ok := filters["rhesus"]; ok {
		query += " AND rhesus = ?"
		args = append(args, rh)
	}

	if city, ok := filters["city"]; ok {
		query += " AND city = ?"
		args = append(args, city)
	}

	if status, ok := filters["availability_status"]; ok {
		query += " AND availability_status = ?"
		args = append(args, status)
	}

	query += " ORDER BY total_donations DESC"

	query = r.db.Rebind(query)

	var users []*models.User
	err := r.db.Select(&users, query, args...)

	return users, err
}