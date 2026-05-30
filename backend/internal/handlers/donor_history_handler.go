package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/icarrr/ambildarahku-backend/internal/models"
	"github.com/icarrr/ambildarahku-backend/internal/repositories"
)

type DonorHistoryHandler struct {
	repo *repositories.DonorHistoryRepository
}

func NewDonorHistoryHandler(repo *repositories.DonorHistoryRepository) *DonorHistoryHandler {
	return &DonorHistoryHandler{repo: repo}
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

	if input.Bags < 1 {
		input.Bags = 1
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
		VerificationStatus: "pending",
	}

	if err := h.repo.Create(history); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create donor history"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"history": history})
}
