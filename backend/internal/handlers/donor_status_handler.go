package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/icarrr/ambildarahku-backend/internal/services"
)

type DonorStatusHandler struct {
	service *services.DonorStatusService
}

func NewDonorStatusHandler(service *services.DonorStatusService) *DonorStatusHandler {
	return &DonorStatusHandler{service: service}
}

func (h *DonorStatusHandler) GetStatus(c *gin.Context) {
	userID, _ := c.Get("user_id")

	eligibility, lastDonation, err := h.service.EvaluateEligibility(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to evaluate status"})
		return
	}

	priority := h.service.GetSearchPriority(userID.(string))

	c.JSON(http.StatusOK, gin.H{
		"eligibility_status": eligibility,
		"last_donation_date": lastDonation,
		"search_priority":    priority,
	})
}

func (h *DonorStatusHandler) UpdateStatus(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var input services.StatusUpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input: " + err.Error()})
		return
	}

	if err := h.service.UpdateStatus(userID.(string), &input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "status updated"})
}
