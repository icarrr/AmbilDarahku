package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/icarrr/ambildarahku-backend/internal/models"
	"github.com/icarrr/ambildarahku-backend/internal/repositories"
)

type ClaimHandler struct {
	claimRepo *repositories.DonationClaimRepository
	userRepo  *repositories.UserRepository
}

func NewClaimHandler(claimRepo *repositories.DonationClaimRepository, userRepo *repositories.UserRepository) *ClaimHandler {
	return &ClaimHandler{claimRepo: claimRepo, userRepo: userRepo}
}

type CreateClaimInput struct {
	DonationDate     string  `json:"donation_date"`
	Location         string  `json:"location"`
	InstitutionName  string  `json:"institution_name"`
	BloodType        string  `json:"blood_type"`
	VolumeMl         int     `json:"volume_ml"`
	ProofPhotoURL    *string `json:"proof_photo_url,omitempty"`
	ProofDocumentURL *string `json:"proof_document_url,omitempty"`
	AdditionalNotes  *string `json:"additional_notes,omitempty"`
}

func (h *ClaimHandler) ListMyClaims(c *gin.Context) {
	userID, _ := c.Get("user_id")

	claims, err := h.claimRepo.FindByUserID(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch claims"})
		return
	}

	if claims == nil {
		claims = []*models.DonationClaim{}
	}

	c.JSON(http.StatusOK, gin.H{"claims": claims})
}

func (h *ClaimHandler) GetClaim(c *gin.Context) {
	userID, _ := c.Get("user_id")
	id := c.Param("id")

	claim, err := h.claimRepo.FindByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "claim not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch claim"})
		return
	}

	if claim.UserID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your claim"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"claim": claim})
}

func (h *ClaimHandler) CreateClaim(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var input CreateClaimInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input: " + err.Error()})
		return
	}

	donationDate, err := time.Parse("2006-01-02", input.DonationDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid donation_date format, use YYYY-MM-DD"})
		return
	}

	if input.Location == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "location is required"})
		return
	}

	if input.VolumeMl < 1 {
		input.VolumeMl = 350
	}

	claim := &models.DonationClaim{
		UserID:           userID.(string),
		DonationDate:     donationDate,
		Location:         input.Location,
		InstitutionName:  input.InstitutionName,
		BloodType:        input.BloodType,
		VolumeMl:         input.VolumeMl,
		ProofPhotoURL:    input.ProofPhotoURL,
		ProofDocumentURL: input.ProofDocumentURL,
		AdditionalNotes:  input.AdditionalNotes,
		Status:           "pending",
	}

	if err := h.claimRepo.Create(claim); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create claim"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"claim": claim})
}

func (h *ClaimHandler) UpdateClaim(c *gin.Context) {
	userID, _ := c.Get("user_id")
	id := c.Param("id")

	existing, err := h.claimRepo.FindByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "claim not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch claim"})
		return
	}

	if existing.UserID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your claim"})
		return
	}

	if existing.Status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "can only update pending claims"})
		return
	}

	var input CreateClaimInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input: " + err.Error()})
		return
	}

	if input.DonationDate != "" {
		t, err := time.Parse("2006-01-02", input.DonationDate)
		if err == nil {
			existing.DonationDate = t
		}
	}
	if input.Location != "" {
		existing.Location = input.Location
	}
	if input.InstitutionName != "" {
		existing.InstitutionName = input.InstitutionName
	}
	if input.BloodType != "" {
		existing.BloodType = input.BloodType
	}
	if input.VolumeMl > 0 {
		existing.VolumeMl = input.VolumeMl
	}
	if input.ProofPhotoURL != nil {
		existing.ProofPhotoURL = input.ProofPhotoURL
	}
	if input.ProofDocumentURL != nil {
		existing.ProofDocumentURL = input.ProofDocumentURL
	}
	if input.AdditionalNotes != nil {
		existing.AdditionalNotes = input.AdditionalNotes
	}

	if err := h.claimRepo.Update(existing); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update claim"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"claim": existing})
}

func (h *ClaimHandler) CancelClaim(c *gin.Context) {
	userID, _ := c.Get("user_id")
	id := c.Param("id")

	if err := h.claimRepo.Delete(id, userID.(string)); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "claim not found or already processed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "claim cancelled"})
}

type ReviewClaimInput struct {
	Status          string  `json:"status"`
	RejectionReason *string `json:"rejection_reason,omitempty"`
}

func (h *ClaimHandler) ReviewClaim(c *gin.Context) {
	adminID, _ := c.Get("user_id")
	id := c.Param("id")

	claim, err := h.claimRepo.FindByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "claim not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch claim"})
		return
	}

	if claim.Status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "claim already reviewed"})
		return
	}

	var input ReviewClaimInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input: " + err.Error()})
		return
	}

	if input.Status != "approved" && input.Status != "rejected" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "status must be 'approved' or 'rejected'"})
		return
	}

	if input.Status == "rejected" && (input.RejectionReason == nil || *input.RejectionReason == "") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "rejection_reason is required when rejecting"})
		return
	}

	adminStr := adminID.(string)
	if err := h.claimRepo.UpdateStatus(id, input.Status, &adminStr, input.RejectionReason); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to review claim"})
		return
	}

	if input.Status == "approved" {
		_ = h.userRepo.RefreshDonationStats(claim.UserID)
	}

	updated, _ := h.claimRepo.FindByID(id)
	c.JSON(http.StatusOK, gin.H{"claim": updated})
}

func (h *ClaimHandler) ListPendingClaims(c *gin.Context) {
	claims, err := h.claimRepo.FindAllByStatus("pending")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch claims"})
		return
	}

	if claims == nil {
		claims = []*models.DonationClaim{}
	}

	c.JSON(http.StatusOK, gin.H{"claims": claims})
}
