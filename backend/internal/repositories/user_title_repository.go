package repositories

import (
	"github.com/jmoiron/sqlx"

	"github.com/icarrr/ambildarahku-backend/internal/models"
)

type UserTitleRepository struct {
	db *sqlx.DB
}

func NewUserTitleRepository(db *sqlx.DB) *UserTitleRepository {
	return &UserTitleRepository{db: db}
}

func (r *UserTitleRepository) Create(t *models.UserTitle) error {
	query := `
		INSERT INTO user_titles (user_id, title, awarded_at, source, config_id, description)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id`
	return r.db.QueryRow(query,
		t.UserID, t.Title, t.AwardedAt, t.Source, t.ConfigID, t.Description,
	).Scan(&t.ID)
}

func (r *UserTitleRepository) FindByUserID(userID string) ([]*models.UserTitle, error) {
	var titles []*models.UserTitle
	err := r.db.Select(&titles,
		"SELECT * FROM user_titles WHERE user_id = $1 ORDER BY awarded_at DESC", userID)
	return titles, err
}

func (r *UserTitleRepository) FindAll() ([]*models.UserTitle, error) {
	var titles []*models.UserTitle
	err := r.db.Select(&titles,
		"SELECT * FROM user_titles ORDER BY awarded_at DESC")
	return titles, err
}

func (r *UserTitleRepository) Delete(id string) error {
	_, err := r.db.Exec("DELETE FROM user_titles WHERE id = $1", id)
	return err
}
