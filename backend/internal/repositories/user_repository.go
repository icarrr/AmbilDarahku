package repositories

import (
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
		INSERT INTO users (full_name, phone, email, password_hash, date_of_birth, gender,
			blood_type, rhesus, weight_kg, height_cm, province, city, district,
			latitude, longitude, username)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
		RETURNING id, created_at, updated_at`
	return r.db.QueryRow(query,
		user.FullName, user.Phone, user.Email, user.PasswordHash,
		user.DateOfBirth, user.Gender, user.BloodType, user.Rhesus,
		user.WeightKg, user.HeightCm, user.Province, user.City, user.District,
		user.Latitude, user.Longitude, user.Username,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
}

func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	user := &models.User{}
	err := r.db.Get(user, "SELECT * FROM users WHERE email = $1", email)
	return user, err
}

func (r *UserRepository) FindByPhone(phone string) (*models.User, error) {
	user := &models.User{}
	err := r.db.Get(user, "SELECT * FROM users WHERE phone = $1", phone)
	return user, err
}

func (r *UserRepository) FindByID(id string) (*models.User, error) {
	user := &models.User{}
	err := r.db.Get(user, "SELECT * FROM users WHERE id = $1", id)
	return user, err
}

func (r *UserRepository) FindByUsername(username string) (*models.User, error) {
	user := &models.User{}
	err := r.db.Get(user, "SELECT * FROM users WHERE username = $1", username)
	return user, err
}

func (r *UserRepository) Update(user *models.User) error {
	query := `
		UPDATE users SET full_name=$2, phone=$3, email=$4, date_of_birth=$5, gender=$6,
			blood_type=$7, rhesus=$8, weight_kg=$9, height_cm=$10, province=$11, city=$12,
			district=$13, latitude=$14, longitude=$15, username=$16, avatar_url=$17,
			availability_mode=$18, availability_status=$19, ready_again_date=$20,
			unavailable_reason=$21, total_donations=$22, last_donation_date=$23,
			eligibility_status=$24, total_points=$25, updated_at=NOW()
		WHERE id=$1`
	_, err := r.db.Exec(query, user.ID, user.FullName, user.Phone, user.Email,
		user.DateOfBirth, user.Gender, user.BloodType, user.Rhesus,
		user.WeightKg, user.HeightCm, user.Province, user.City, user.District,
		user.Latitude, user.Longitude, user.Username, user.AvatarURL,
		user.AvailabilityMode, user.AvailabilityStatus, user.ReadyAgainDate,
		user.UnavailableReason, user.TotalDonations, user.LastDonationDate,
		user.EligibilityStatus, user.TotalPoints)
	return err
}

func (r *UserRepository) Search(filters map[string]interface{}) ([]*models.User, error) {
	query := "SELECT * FROM users WHERE 1=1"
	args := []interface{}{}
	i := 1

	if bt, ok := filters["blood_type"]; ok {
		query += " AND blood_type = $1"
		args = append(args, bt)
		i++
	}
	if rh, ok := filters["rhesus"]; ok {
		query += " AND rhesus = $2"
		args = append(args, rh)
		i++
	}
	if city, ok := filters["city"]; ok {
		query += " AND city = $3"
		args = append(args, city)
		i++
	}
	if status, ok := filters["availability_status"]; ok {
		query += " AND availability_status = $4"
		args = append(args, status)
		i++
	}

	query += " ORDER BY total_donations DESC"

	var users []*models.User
	err := r.db.Select(&users, query, args...)
	return users, err
}
