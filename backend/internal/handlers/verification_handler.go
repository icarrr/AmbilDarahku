package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/icarrr/ambildarahku-backend/internal/models"
	"github.com/icarrr/ambildarahku-backend/internal/repositories"
)

type VerificationHandler struct {
	verifRepo *repositories.DonorVerificationRepository
	userRepo  *repositories.UserRepository
}

func NewVerificationHandler(verifRepo *repositories.DonorVerificationRepository, userRepo *repositories.UserRepository) *VerificationHandler {
	return &VerificationHandler{verifRepo: verifRepo, userRepo: userRepo}
}

func (h *VerificationHandler) GetMyVerification(c *gin.Context) {
	userID, _ := c.Get("user_id")

	user, err := h.userRepo.FindByID(userID.(string))
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	verifications, err := h.verifRepo.FindByUserID(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch verifications"})
		return
	}
	if verifications == nil {
		verifications = []*models.DonorVerification{}
	}

	c.JSON(http.StatusOK, gin.H{
		"current_level":  user.VerificationLevel,
		"max_level":      3,
		"verifications":  verifications,
	})
}

type SubmitVerificationInput struct {
	Level        int     `json:"level" binding:"required"`
	VerifierRole string  `json:"verifier_role" binding:"required"`
	Notes        *string `json:"notes,omitempty"`
}

func (h *VerificationHandler) SubmitVerification(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var input SubmitVerificationInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input: " + err.Error()})
		return
	}

	if input.Level < 1 || input.Level > 3 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "level must be 1, 2, or 3"})
		return
	}

	validRoles := map[string]bool{"community": true, "pmi": true}
	if !validRoles[input.VerifierRole] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "verifier_role must be 'community' or 'pmi'"})
		return
	}

	existing, _ := h.verifRepo.FindLatestByUserID(userID.(string), input.Level)
	if existing != nil && existing.Status == "pending" {
		c.JSON(http.StatusConflict, gin.H{"error": "already have a pending verification request for this level"})
		return
	}

	verification := &models.DonorVerification{
		UserID:       userID.(string),
		Level:        input.Level,
		Status:       "pending",
		VerifierRole: input.VerifierRole,
		Notes:        input.Notes,
	}

	if err := h.verifRepo.Create(verification); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to submit verification"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"verification": verification})
}

type ReviewVerificationInput struct {
	Status string  `json:"status" binding:"required"`
	Notes  *string `json:"notes,omitempty"`
}

func (h *VerificationHandler) ReviewVerification(c *gin.Context) {
	adminID, _ := c.Get("user_id")
	id := c.Param("id")

	verification, err := h.verifRepo.FindByID(id)
	if err != nil || verification == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "verification not found"})
		return
	}

	if verification.Status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "verification already reviewed"})
		return
	}

	var input ReviewVerificationInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input: " + err.Error()})
		return
	}

	if input.Status != "approved" && input.Status != "rejected" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "status must be 'approved' or 'rejected'"})
		return
	}

	if err := h.verifRepo.Update(id, input.Status, adminID.(string), input.Notes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to review verification"})
		return
	}

	if input.Status == "approved" {
		_ = h.userRepo.UpdateVerificationLevel(verification.UserID, verification.Level)
	}

	updated, _ := h.verifRepo.FindByID(id)
	c.JSON(http.StatusOK, gin.H{"verification": updated})
}

func (h *VerificationHandler) ListPendingVerifications(c *gin.Context) {
	verifications, err := h.verifRepo.FindPendingAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch verifications"})
		return
	}
	if verifications == nil {
		verifications = []*models.DonorVerification{}
	}
	c.JSON(http.StatusOK, gin.H{"verifications": verifications})
}
