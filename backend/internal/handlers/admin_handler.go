package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"

	"github.com/icarrr/ambildarahku-backend/internal/repositories"
)

type AdminHandler struct {
	db       *sqlx.DB
	claimRepo   *repositories.DonationClaimRepository
	verifRepo   *repositories.DonorVerificationRepository
	userRepo    *repositories.UserRepository
}

func NewAdminHandler(
	db *sqlx.DB,
	claimRepo *repositories.DonationClaimRepository,
	verifRepo *repositories.DonorVerificationRepository,
	userRepo *repositories.UserRepository,
) *AdminHandler {
	return &AdminHandler{
		db:       db,
		claimRepo:   claimRepo,
		verifRepo:   verifRepo,
		userRepo:    userRepo,
	}
}

func (h *AdminHandler) GetStats(c *gin.Context) {
	var pendingClaims int
	_ = h.db.Get(&pendingClaims, "SELECT COUNT(*) FROM donation_claims WHERE status = 'pending'")

	var pendingVerifications int
	_ = h.db.Get(&pendingVerifications, "SELECT COUNT(*) FROM donor_verifications WHERE status = 'pending'")

	var totalUsers int
	_ = h.db.Get(&totalUsers, "SELECT COUNT(*) FROM users")

	var totalDonors int
	_ = h.db.Get(&totalDonors, "SELECT COUNT(*) FROM users WHERE role = 'donor'")

	var totalDonations int
	_ = h.db.Get(&totalDonations, "SELECT COALESCE(SUM(total_donations), 0) FROM users")

	c.JSON(http.StatusOK, gin.H{
		"pending_claims":       pendingClaims,
		"pending_verifications": pendingVerifications,
		"total_users":          totalUsers,
		"total_donors":         totalDonors,
		"total_donations":      totalDonations,
	})
}

func (h *AdminHandler) ListPendingClaims(c *gin.Context) {
	claims, err := h.claimRepo.FindPendingWithUser()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch claims"})
		return
	}

	if claims == nil {
		claims = []*repositories.ClaimWithUser{}
	}

	c.JSON(http.StatusOK, gin.H{"claims": claims})
}

func (h *AdminHandler) GetClaimDetail(c *gin.Context) {
	id := c.Param("id")

	var claim repositories.ClaimWithUser
	err := h.db.Get(&claim, `
		SELECT c.*, u.full_name, u.email, u.phone,
			u.blood_type AS donor_blood_type, u.city AS donor_city
		FROM donation_claims c
		JOIN users u ON u.id = c.user_id
		WHERE c.id = $1`, id)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "claim not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch claim"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"claim": claim})
}

func (h *AdminHandler) ListPendingVerifications(c *gin.Context) {
	verifications, err := h.verifRepo.FindPendingWithUser()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch verifications"})
		return
	}

	if verifications == nil {
		verifications = []*repositories.VerificationWithUser{}
	}

	c.JSON(http.StatusOK, gin.H{"verifications": verifications})
}
