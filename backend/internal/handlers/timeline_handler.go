package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/icarrr/ambildarahku-backend/internal/repositories"
)

type TimelineHandler struct {
	verifRepo *repositories.DonorVerificationRepository
}

func NewTimelineHandler(verifRepo *repositories.DonorVerificationRepository) *TimelineHandler {
	return &TimelineHandler{verifRepo: verifRepo}
}

func (h *TimelineHandler) GetMyTimeline(c *gin.Context) {
	userID, _ := c.Get("user_id")

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if limit < 1 || limit > 100 {
		limit = 50
	}

	entries, err := h.verifRepo.GetTimeline(userID.(string), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch timeline"})
		return
	}

	if entries == nil {
		entries = []*repositories.TimelineEntry{}
	}

	c.JSON(http.StatusOK, gin.H{"entries": entries})
}

func (h *TimelineHandler) GetPublicTimeline(c *gin.Context) {
	username := c.Param("username")

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if limit < 1 || limit > 100 {
		limit = 50
	}

	entries, err := h.verifRepo.GetPublicTimeline(username, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch timeline"})
		return
	}

	if entries == nil {
		entries = []*repositories.TimelineEntry{}
	}

	c.JSON(http.StatusOK, gin.H{"entries": entries})
}
