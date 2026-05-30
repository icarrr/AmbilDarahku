package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/icarrr/ambildarahku-backend/internal/models"
	"github.com/icarrr/ambildarahku-backend/internal/repositories"
)

type BloodRequestHandler struct {
	repo *repositories.BloodRequestRepository
}

func NewBloodRequestHandler(repo *repositories.BloodRequestRepository) *BloodRequestHandler {
	return &BloodRequestHandler{repo: repo}
}

type CreateRequestInput struct {
	PatientName  string  `json:"patient_name"`
	Hospital     string  `json:"hospital"`
	BloodType    string  `json:"blood_type"`
	Rhesus       string  `json:"rhesus"`
	Bags         int     `json:"bags"`
	Urgency      string  `json:"urgency"`
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`
	City         string  `json:"city"`
	ContactPhone string  `json:"contact_phone"`
	Notes        *string `json:"notes,omitempty"`
}

func (h *BloodRequestHandler) Create(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var input CreateRequestInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input: " + err.Error()})
		return
	}

	req := &models.BloodRequest{
		RequesterID:  userID.(string),
		PatientName:  input.PatientName,
		Hospital:     input.Hospital,
		BloodType:    input.BloodType,
		Rhesus:       input.Rhesus,
		Bags:         input.Bags,
		Urgency:      input.Urgency,
		Latitude:     input.Latitude,
		Longitude:    input.Longitude,
		City:         input.City,
		ContactPhone: input.ContactPhone,
		Notes:        input.Notes,
		Status:       "open",
	}

	if err := h.repo.Create(req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create request"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"request": req})
}

func (h *BloodRequestHandler) ListOpen(c *gin.Context) {
	filters := map[string]interface{}{}
	if bt := c.Query("blood_type"); bt != "" {
		filters["blood_type"] = bt
	}
	if rh := c.Query("rhesus"); rh != "" {
		filters["rhesus"] = rh
	}

	requests, err := h.repo.FindOpen(filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch requests"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"requests": requests})
}

func (h *BloodRequestHandler) MyRequests(c *gin.Context) {
	userID, _ := c.Get("user_id")

	requests, err := h.repo.FindByRequesterID(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch requests"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"requests": requests})
}

func (h *BloodRequestHandler) UpdateStatus(c *gin.Context) {
	id := c.Param("id")

	var input struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	if err := h.repo.UpdateStatus(id, input.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "status updated"})
}
