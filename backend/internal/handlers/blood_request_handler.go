package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/icarrr/ambildarahku-backend/internal/models"
	"github.com/icarrr/ambildarahku-backend/internal/repositories"
)

type BloodRequestHandler struct {
	repo       *repositories.BloodRequestRepository
	fulfill    *repositories.FulfillmentRepository
	historyRepo *repositories.DonorHistoryRepository
	userRepo   *repositories.UserRepository
}

func NewBloodRequestHandler(repo *repositories.BloodRequestRepository, fulfill *repositories.FulfillmentRepository, historyRepo *repositories.DonorHistoryRepository, userRepo *repositories.UserRepository) *BloodRequestHandler {
	return &BloodRequestHandler{repo: repo, fulfill: fulfill, historyRepo: historyRepo, userRepo: userRepo}
}

type CreateRequestInput struct {
	PatientName  string  `json:"patient_name"`
	Hospital     string  `json:"hospital"`
	BloodType    string  `json:"blood_type"`
	Bags         int     `json:"bags"`
	Urgency      string  `json:"urgency"`
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`
	City         string  `json:"city"`
	ContactPhone string  `json:"contact_phone"`
	Notes        *string `json:"notes,omitempty"`
}

func (h *BloodRequestHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	req, err := h.repo.FindByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "request not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"request": req})
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
		Rhesus:       "+",
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
	if urgency := c.Query("urgency"); urgency != "" {
		filters["urgency"] = urgency
	}
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			filters["limit"] = l
		}
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

func (h *BloodRequestHandler) Fulfill(c *gin.Context) {
	id := c.Param("id")
	donorID, _ := c.Get("user_id")

	var input struct {
		Bags int `json:"bags"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}
	if input.Bags < 1 {
		input.Bags = 1
	}

	req, err := h.repo.FindByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "request not found"})
		return
	}

	f := &models.RequestFulfillment{
		RequestID: id,
		DonorID:   donorID.(string),
		Bags:      input.Bags,
	}

	if err := h.fulfill.Create(f); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to record fulfillment"})
		return
	}

	total, fulfilled, err := h.repo.AddFulfillment(id, input.Bags)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update request"})
		return
	}

	today := time.Now().Truncate(24 * time.Hour)
	existing, _ := h.historyRepo.FindByUserIDAndDate(donorID.(string), today)
	if !existing {
		history := &models.DonorHistory{
			UserID:             donorID.(string),
			DonationDate:       time.Now(),
			Location:           req.City,
			Institution:        req.Hospital,
			Bags:               input.Bags,
			VerificationStatus: "verified",
		}
		if err := h.historyRepo.Create(history); err == nil {
			h.userRepo.RefreshDonationStats(donorID.(string))
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"fulfillment":    f,
		"total_bags":     total,
		"fulfilled_bags": fulfilled,
	})
}

func (h *BloodRequestHandler) ListFulfillments(c *gin.Context) {
	id := c.Param("id")

	fulfillments, err := h.fulfill.FindByRequestID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch fulfillments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"fulfillments": fulfillments})
}
