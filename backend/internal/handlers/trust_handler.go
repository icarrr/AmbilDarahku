package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/icarrr/ambildarahku-backend/internal/repositories"
	"github.com/icarrr/ambildarahku-backend/internal/services"
)

type TrustHandler struct {
	trustSvc *services.TrustService
	userRepo *repositories.UserRepository
}

func NewTrustHandler(trustSvc *services.TrustService, userRepo *repositories.UserRepository) *TrustHandler {
	return &TrustHandler{trustSvc: trustSvc, userRepo: userRepo}
}

func (h *TrustHandler) GetOwnTrustScore(c *gin.Context) {
	userID, _ := c.Get("user_id")

	score, err := h.trustSvc.Calculate(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to calculate trust score"})
		return
	}

	storedScore, _ := h.trustSvc.GetStoredScore(userID.(string))
	c.JSON(http.StatusOK, gin.H{"trust_score": score, "stored_score": storedScore})
}

func (h *TrustHandler) GetPublicTrustScore(c *gin.Context) {
	username := c.Param("username")
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username is required"})
		return
	}

	userID, err := h.trustSvc.GetUserIDByUsername(username)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to find user"})
		return
	}

	storedScore, _ := h.trustSvc.GetStoredScore(userID)
	score, err := h.trustSvc.Calculate(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to calculate trust score"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"trust_score": score, "stored_score": storedScore})
}

func (h *TrustHandler) RefreshTrustScore(c *gin.Context) {
	userID, _ := c.Get("user_id")

	score, err := h.trustSvc.Calculate(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to calculate trust score"})
		return
	}

	if err := h.userRepo.UpdateTrustScore(userID.(string), score.Overall); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save trust score"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"trust_score": score, "message": "trust score refreshed"})
}
