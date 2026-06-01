package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"

	"github.com/icarrr/ambildarahku-backend/internal/models"
)

type LeaderboardHandler struct {
	db *sqlx.DB
}

func NewLeaderboardHandler(db *sqlx.DB) *LeaderboardHandler {
	return &LeaderboardHandler{db: db}
}

func (h *LeaderboardHandler) National(c *gin.Context) {
	var users []*models.User
	err := h.db.Select(&users,
		"SELECT id, full_name, blood_type, city, total_donations, total_points, last_donation_date "+
			"FROM users ORDER BY total_points DESC, total_donations DESC LIMIT 100")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch leaderboard"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"leaderboard": users})
}

func (h *LeaderboardHandler) Regional(c *gin.Context) {
	city := c.Query("city")
	if city == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "city parameter required"})
		return
	}

	var users []*models.User
	err := h.db.Select(&users,
		"SELECT id, full_name, blood_type, city, total_donations, total_points, last_donation_date "+
			"FROM users WHERE city = $1 ORDER BY total_points DESC, total_donations DESC LIMIT 50", city)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch leaderboard"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"leaderboard": users})
}
