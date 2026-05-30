package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/icarrr/ambildarahku-backend/internal/models"
	"github.com/icarrr/ambildarahku-backend/internal/repositories"
)

type UserHandler struct {
	userRepo *repositories.UserRepository
	badgeRepo *repositories.BadgeRepository
}

func NewUserHandler(userRepo *repositories.UserRepository, badgeRepo *repositories.BadgeRepository) *UserHandler {
	return &UserHandler{userRepo: userRepo, badgeRepo: badgeRepo}
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")

	user, err := h.userRepo.FindByID(userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	badges, _ := h.badgeRepo.FindByUserID(user.ID)

	c.JSON(http.StatusOK, gin.H{
		"user":   user,
		"badges": badges,
	})
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")

	user, err := h.userRepo.FindByID(userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	if v, ok := input["full_name"]; ok { user.FullName = v.(string) }
	if v, ok := input["phone"]; ok { user.Phone = v.(string) }
	if v, ok := input["weight_kg"]; ok { user.WeightKg = v.(float64) }
	if v, ok := input["height_cm"]; ok { user.HeightCm = v.(float64) }
	if v, ok := input["province"]; ok { user.Province = v.(string) }
	if v, ok := input["city"]; ok { user.City = v.(string) }
	if v, ok := input["district"]; ok { user.District = v.(string) }
	if v, ok := input["latitude"]; ok { user.Latitude = v.(float64) }
	if v, ok := input["longitude"]; ok { user.Longitude = v.(float64) }
	if v, ok := input["username"]; ok { s := v.(string); user.Username = &s }
	if v, ok := input["avatar_url"]; ok { s := v.(string); user.AvatarURL = &s }

	if err := h.userRepo.Update(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}

type PublicProfile struct {
	FullName       string                `json:"full_name"`
	BloodType      string                `json:"blood_type"`
	Rhesus         string                `json:"rhesus"`
	City           string                `json:"city"`
	TotalDonations int                   `json:"total_donations"`
	Badges         []*models.UserBadge   `json:"badges,omitempty"`
}

func (h *UserHandler) GetPublicProfile(c *gin.Context) {
	username := c.Param("username")

	user, err := h.userRepo.FindByUsername(username)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	badges, _ := h.badgeRepo.FindByUserID(user.ID)

	c.JSON(http.StatusOK, PublicProfile{
		FullName:       user.FullName,
		BloodType:      user.BloodType,
		Rhesus:         user.Rhesus,
		City:           user.City,
		TotalDonations: user.TotalDonations,
		Badges:         badges,
	})
}
