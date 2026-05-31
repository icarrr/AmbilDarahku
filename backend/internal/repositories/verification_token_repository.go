package repositories

import (
	"database/sql"
	"errors"
	"time"

	"github.com/jmoiron/sqlx"

	"github.com/icarrr/ambildarahku-backend/internal/models"
)

type VerificationTokenRepository struct {
	db *sqlx.DB
}

func NewVerificationTokenRepository(db *sqlx.DB) *VerificationTokenRepository {
	return &VerificationTokenRepository{db: db}
}

func (r *VerificationTokenRepository) Create(token *models.VerificationToken) error {
	query := `
		INSERT INTO verification_tokens (user_id, token, type, expires_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at
	`
	return r.db.QueryRow(query, token.UserID, token.Token, token.Type, token.ExpiresAt).
		Scan(&token.ID, &token.CreatedAt)
}

func (r *VerificationTokenRepository) FindByToken(token, tokenType string) (*models.VerificationToken, error) {
	var t models.VerificationToken
	err := r.db.Get(&t,
		"SELECT * FROM verification_tokens WHERE token = $1 AND type = $2 AND used_at IS NULL AND expires_at > NOW()",
		token, tokenType)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &t, nil
}

func (r *VerificationTokenRepository) MarkUsed(id string) error {
	now := time.Now()
	_, err := r.db.Exec("UPDATE verification_tokens SET used_at = $1 WHERE id = $2", now, id)
	return err
}

func (r *VerificationTokenRepository) DeleteByUserID(userID, tokenType string) error {
	_, err := r.db.Exec("DELETE FROM verification_tokens WHERE user_id = $1 AND type = $2 AND used_at IS NULL",
		userID, tokenType)
	return err
}
