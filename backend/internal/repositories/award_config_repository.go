package repositories

import (
	"github.com/jmoiron/sqlx"

	"github.com/icarrr/ambildarahku-backend/internal/models"
)

type AwardConfigRepository struct {
	db *sqlx.DB
}

func NewAwardConfigRepository(db *sqlx.DB) *AwardConfigRepository {
	return &AwardConfigRepository{db: db}
}

func (r *AwardConfigRepository) Create(c *models.AwardConfig) error {
	query := `
		INSERT INTO award_configs (name, description, award_type, criteria, scope, scope_value, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at`
	return r.db.QueryRow(query,
		c.Name, c.Description, c.AwardType, c.Criteria, c.Scope, c.ScopeValue, c.IsActive,
	).Scan(&c.ID, &c.CreatedAt, &c.UpdatedAt)
}

func (r *AwardConfigRepository) FindAll() ([]*models.AwardConfig, error) {
	var configs []*models.AwardConfig
	err := r.db.Select(&configs, "SELECT * FROM award_configs ORDER BY created_at DESC")
	return configs, err
}

func (r *AwardConfigRepository) FindByID(id string) (*models.AwardConfig, error) {
	var c models.AwardConfig
	err := r.db.Get(&c, "SELECT * FROM award_configs WHERE id = $1", id)
	return &c, err
}

func (r *AwardConfigRepository) Update(c *models.AwardConfig) error {
	_, err := r.db.Exec(`
		UPDATE award_configs SET name=$2, description=$3, award_type=$4, criteria=$5,
			scope=$6, scope_value=$7, is_active=$8, updated_at=NOW()
		WHERE id=$1`,
		c.ID, c.Name, c.Description, c.AwardType, c.Criteria, c.Scope, c.ScopeValue, c.IsActive)
	return err
}

func (r *AwardConfigRepository) Delete(id string) error {
	_, err := r.db.Exec("DELETE FROM award_configs WHERE id = $1", id)
	return err
}

func (r *AwardConfigRepository) FindActiveByScope(scope, scopeValue string) ([]*models.AwardConfig, error) {
	var configs []*models.AwardConfig
	err := r.db.Select(&configs,
		"SELECT * FROM award_configs WHERE is_active = true AND scope = $1 AND (scope_value = $2 OR scope_value IS NULL)",
		scope, scopeValue)
	return configs, err
}
