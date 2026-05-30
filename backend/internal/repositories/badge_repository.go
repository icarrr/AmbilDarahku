package repositories

import (
	"github.com/jmoiron/sqlx"

	"github.com/icarrr/ambildarahku-backend/internal/models"
)

type BadgeRepository struct {
	db *sqlx.DB
}

func NewBadgeRepository(db *sqlx.DB) *BadgeRepository {
	return &BadgeRepository{db: db}
}

func (r *BadgeRepository) FindAll() ([]*models.Badge, error) {
	var badges []*models.Badge
	err := r.db.Select(&badges, "SELECT * FROM badges ORDER BY min_donations ASC")
	return badges, err
}

func (r *BadgeRepository) FindByUserID(userID string) ([]*models.UserBadge, error) {
	var userBadges []*models.UserBadge
	err := r.db.Select(&userBadges, `
		SELECT ub.*, b.id "badge.id", b.name "badge.name", b.description "badge.description",
			b.icon_url "badge.icon_url", b.min_donations "badge.min_donations"
		FROM user_badges ub
		JOIN badges b ON b.id = ub.badge_id
		WHERE ub.user_id = $1
		ORDER BY b.min_donations ASC`, userID)
	return userBadges, err
}

func (r *BadgeRepository) AwardBadge(userID string, badgeID string) error {
	_, err := r.db.Exec(
		"INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
		userID, badgeID)
	return err
}

func (r *BadgeRepository) SeedDefaults() error {
	badges := []struct {
		Name        string
		Description string
		MinDonor    int
	}{
		{"First Drop", "1 kali donor darah", 1},
		{"Lifesaver", "5 kali donor darah", 5},
		{"Hero", "10 kali donor darah", 10},
		{"Guardian", "25 kali donor darah", 25},
		{"Legend", "50 kali donor darah", 50},
		{"Blood Champion", "100 kali donor darah", 100},
	}

	for _, b := range badges {
		_, err := r.db.Exec(`
			INSERT INTO badges (name, description, min_donations)
			VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING`,
			b.Name, b.Description, b.MinDonor)
		if err != nil {
			return err
		}
	}
	return nil
}
