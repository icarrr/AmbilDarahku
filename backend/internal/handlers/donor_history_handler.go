package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/icarrr/ambildarahku-backend/internal/models"
	"github.com/icarrr/ambildarahku-backend/internal/repositories"
)

type DonorHistoryHandler struct {
	repo     *repositories.DonorHistoryRepository
	userRepo *repositories.UserRepository
}

func NewDonorHistoryHandler(repo *repositories.DonorHistoryRepository, userRepo *repositories.UserRepository) *DonorHistoryHandler {
	return &DonorHistoryHandler{repo: repo, userRepo: userRepo}
}

func (h *DonorHistoryHandler) List(c *gin.Context) {
	userID, _ := c.Get("user_id")

	histories, err := h.repo.FindByUserID(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch histories"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"histories": histories})
}

type CreateHistoryInput struct {
	DonationDate string  `json:"donation_date"`
	Location     string  `json:"location"`
	Institution  string  `json:"institution"`
	Bags         int     `json:"bags"`
	Notes        *string `json:"notes,omitempty"`
	ProofPhoto   *string `json:"proof_photo,omitempty"`
	ProofCard    *string `json:"proof_card,omitempty"`
	ProofLetter  *string `json:"proof_letter,omitempty"`
}

func (h *DonorHistoryHandler) Update(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")

	history, err := h.repo.FindByID(id)
	if err != nil || history == nil || history.UserID != userID.(string) {
		c.JSON(http.StatusNotFound, gin.H{"error": "history not found"})
		return
	}

	var input struct {
		ProofPhoto *string `json:"proof_photo,omitempty"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input: " + err.Error()})
		return
	}

	if input.ProofPhoto == nil || *input.ProofPhoto == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "proof_photo is required"})
		return
	}

	if err := h.repo.UpdatePhoto(id, input.ProofPhoto); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update proof photo"})
		return
	}

	_ = h.userRepo.RefreshDonationStats(userID.(string))

	updated, _ := h.repo.FindByID(id)
	c.JSON(http.StatusOK, gin.H{"history": updated})
}

func (h *DonorHistoryHandler) Create(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var input CreateHistoryInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input: " + err.Error()})
		return
	}

	donationDate, err := time.Parse("2006-01-02", input.DonationDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid donation_date format, use YYYY-MM-DD"})
		return
	}

	existing, err := h.repo.FindByUserIDAndDate(userID.(string), donationDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check existing records"})
		return
	}
	if existing {
		c.JSON(http.StatusConflict, gin.H{"error": "Anda sudah mencatat donor pada tanggal ini"})
		return
	}

	if input.Bags < 1 {
		input.Bags = 1
	}

	verificationStatus := "pending"
	if input.ProofPhoto != nil && *input.ProofPhoto != "" {
		verificationStatus = "verified"
	}

	history := &models.DonorHistory{
		UserID:             userID.(string),
		DonationDate:       donationDate,
		Location:           input.Location,
		Institution:        input.Institution,
		Bags:               input.Bags,
		Notes:              input.Notes,
		ProofPhoto:         input.ProofPhoto,
		ProofCard:          input.ProofCard,
		ProofLetter:        input.ProofLetter,
		VerificationStatus: verificationStatus,
	}

	if err := h.repo.Create(history); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create donor history"})
		return
	}

	_ = h.userRepo.RefreshDonationStats(userID.(string))

	c.JSON(http.StatusCreated, gin.H{"history": history})
}
