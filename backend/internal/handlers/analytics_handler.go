package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"

	"github.com/icarrr/ambildarahku-backend/internal/repositories"
	"github.com/icarrr/ambildarahku-backend/internal/services"
)

type AnalyticsHandler struct {
	db       *sqlx.DB
	userRepo *repositories.UserRepository
	trustSvc *services.TrustService
}

func NewAnalyticsHandler(db *sqlx.DB, userRepo *repositories.UserRepository, trustSvc *services.TrustService) *AnalyticsHandler {
	return &AnalyticsHandler{db: db, userRepo: userRepo, trustSvc: trustSvc}
}

type DonationByInstitution struct {
	Institution string `db:"institution" json:"institution"`
	Total       int    `db:"total" json:"total"`
}

type DonationByCity struct {
	City  string `db:"city" json:"city"`
	Total int    `db:"total" json:"total"`
}

type DonationByYear struct {
	Year  int `db:"year" json:"year"`
	Total int `db:"total" json:"total"`
}

type DonationByMonth struct {
	Year  int `db:"year" json:"year"`
	Month int `db:"month" json:"month"`
	Total int `db:"total" json:"total"`
}

type TopDonor struct {
	UserID         string  `db:"user_id" json:"user_id"`
	FullName       string  `db:"full_name" json:"full_name"`
	TotalDonations int     `db:"total_donations" json:"total_donations"`
	TrustScore     float64 `db:"trust_score" json:"trust_score"`
}

func (h *AnalyticsHandler) GetDonationsByInstitution(c *gin.Context) {
	var data []DonationByInstitution
	err := h.db.Select(&data, `
		SELECT institution, COUNT(*) AS total
		FROM donor_histories
		GROUP BY institution
		ORDER BY total DESC
		LIMIT 20`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch analytics"})
		return
	}
	if data == nil {
		data = []DonationByInstitution{}
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

func (h *AnalyticsHandler) GetDonationsByCity(c *gin.Context) {
	var data []DonationByCity
	err := h.db.Select(&data, `
		SELECT u.city, COUNT(dh.id) AS total
		FROM donor_histories dh
		JOIN users u ON u.id = dh.user_id
		WHERE u.city != ''
		GROUP BY u.city
		ORDER BY total DESC
		LIMIT 20`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch analytics"})
		return
	}
	if data == nil {
		data = []DonationByCity{}
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

func (h *AnalyticsHandler) GetDonationsByYear(c *gin.Context) {
	var data []DonationByYear
	err := h.db.Select(&data, `
		SELECT EXTRACT(YEAR FROM donation_date)::int AS year, COUNT(*)::int AS total
		FROM donor_histories
		GROUP BY year
		ORDER BY year DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch analytics"})
		return
	}
	if data == nil {
		data = []DonationByYear{}
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

func (h *AnalyticsHandler) GetDonationsByMonth(c *gin.Context) {
	var data []DonationByMonth
	err := h.db.Select(&data, `
		SELECT EXTRACT(YEAR FROM donation_date)::int AS year,
			EXTRACT(MONTH FROM donation_date)::int AS month,
			COUNT(*)::int AS total
		FROM donor_histories
		WHERE donation_date >= CURRENT_DATE - INTERVAL '12 months'
		GROUP BY year, month
		ORDER BY year DESC, month DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch analytics"})
		return
	}
	if data == nil {
		data = []DonationByMonth{}
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

func (h *AnalyticsHandler) GetAgeDistribution(c *gin.Context) {
	type AgeBucket struct {
		Bucket string `json:"bucket"`
		Total  int    `json:"total"`
	}
	var data []AgeBucket
	err := h.db.Select(&data, `
		SELECT
			CASE
				WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) < 20 THEN '17-20'
				WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN 20 AND 29 THEN '20-29'
				WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN 30 AND 39 THEN '30-39'
				WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN 40 AND 49 THEN '40-49'
				ELSE '50+'
			END AS bucket,
			COUNT(*)::int AS total
		FROM users
		GROUP BY bucket
		ORDER BY bucket`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch analytics"})
		return
	}
	if data == nil {
		data = []AgeBucket{}
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

func (h *AnalyticsHandler) GetTopDonors(c *gin.Context) {
	var data []TopDonor
	err := h.db.Select(&data, `
		SELECT id AS user_id, full_name, total_donations, trust_score
		FROM users
		WHERE role = 'donor'
		ORDER BY total_donations DESC
		LIMIT 10`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch top donors"})
		return
	}
	if data == nil {
		data = []TopDonor{}
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}
