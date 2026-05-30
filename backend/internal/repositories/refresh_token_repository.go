package repositories

import (
	"crypto/sha256"
	"encoding/hex"

	"github.com/jmoiron/sqlx"

	"github.com/icarrr/ambildarahku-backend/internal/models"
)

type RefreshTokenRepository struct {
	db *sqlx.DB
}

func NewRefreshTokenRepository(db *sqlx.DB) *RefreshTokenRepository {
	return &RefreshTokenRepository{db: db}
}

func hashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}

func (r *RefreshTokenRepository) Create(userID string, token string, expiresAt string) error {
	_, err := r.db.Exec(`
		INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)`, userID, hashToken(token), expiresAt)
	return err
}

func (r *RefreshTokenRepository) FindByToken(token string) (*models.RefreshToken, error) {
	rt := &models.RefreshToken{}
	err := r.db.Get(rt,
		"SELECT * FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW()",
		hashToken(token))
	return rt, err
}

func (r *RefreshTokenRepository) DeleteByUserID(userID string) error {
	_, err := r.db.Exec("DELETE FROM refresh_tokens WHERE user_id = $1", userID)
	return err
}

func (r *RefreshTokenRepository) DeleteByToken(token string) error {
	_, err := r.db.Exec("DELETE FROM refresh_tokens WHERE token_hash = $1", hashToken(token))
	return err
}
