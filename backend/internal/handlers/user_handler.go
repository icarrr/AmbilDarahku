package handlers

import (
	"net/http"
	"time"

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
	if badges == nil {
		badges = []*models.UserBadge{}
	}

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
	if v, ok := input["blood_type"]; ok { user.BloodType = v.(string) }
	if v, ok := input["gender"]; ok { user.Gender = v.(string) }
	if v, ok := input["date_of_birth"]; ok {
		if t, err := time.Parse("2006-01-02", v.(string)); err == nil {
			user.DateOfBirth = t
		}
	}

	if err := h.userRepo.Update(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}

type PublicProfile struct {
	FullName           string                `json:"full_name"`
	BloodType          string                `json:"blood_type"`
	City               string                `json:"city"`
	TotalDonations     int                   `json:"total_donations"`
	TotalPoints        int                   `json:"total_points"`
	AvailabilityStatus string                `json:"availability_status"`
	EligibilityStatus  string                `json:"eligibility_status"`
	LastDonationDate   *time.Time             `json:"last_donation_date,omitempty"`
	Gender             string                `json:"gender"`
	Badges             []*models.UserBadge   `json:"badges,omitempty"`
}

type UserListItem struct {
	ID               string     `json:"id"`
	FullName         string     `json:"full_name"`
	Email            string     `json:"email"`
	Phone            string     `json:"phone"`
	Role             string     `json:"role"`
	BloodType        string     `json:"blood_type"`
	City             string     `json:"city"`
	TotalDonations   int        `json:"total_donations"`
	EligibilityStatus string    `json:"eligibility_status"`
	AvailabilityStatus string   `json:"availability_status"`
	CreatedAt        time.Time  `json:"created_at"`
}

func (h *UserHandler) ListAll(c *gin.Context) {
	users, err := h.userRepo.FindAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch users"})
		return
	}

	items := make([]UserListItem, 0, len(users))
	for _, u := range users {
		items = append(items, UserListItem{
			ID:                u.ID,
			FullName:          u.FullName,
			Email:             u.Email,
			Phone:             u.Phone,
			Role:              u.Role,
			BloodType:         u.BloodType,
			City:              u.City,
			TotalDonations:    u.TotalDonations,
			EligibilityStatus:  u.EligibilityStatus,
			AvailabilityStatus: u.AvailabilityStatus,
			CreatedAt:         u.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"users": items})
}

func (h *UserHandler) UpdateUserRole(c *gin.Context) {
	id := c.Param("id")

	var input struct {
		Role string `json:"role"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	validRoles := map[string]bool{"donor": true, "super_admin": true, "community_admin": true, "pmi_admin": true, "hospital_admin": true}
	if !validRoles[input.Role] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role"})
		return
	}

	user, err := h.userRepo.FindByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	user.Role = input.Role
	if err := h.userRepo.Update(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "role updated", "user_id": id, "role": input.Role})
}

func (h *UserHandler) GetPublicProfile(c *gin.Context) {
	username := c.Param("username")

	user, err := h.userRepo.FindByUsername(username)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	badges, _ := h.badgeRepo.FindByUserID(user.ID)
	if badges == nil {
		badges = []*models.UserBadge{}
	}

	c.JSON(http.StatusOK, PublicProfile{
		FullName:           user.FullName,
		BloodType:          user.BloodType,
		City:               user.City,
		TotalDonations:     user.TotalDonations,
		TotalPoints:        user.TotalPoints,
		AvailabilityStatus: user.AvailabilityStatus,
		EligibilityStatus:  user.EligibilityStatus,
		LastDonationDate:   user.LastDonationDate,
		Gender:             user.Gender,
		Badges:             badges,
	})
}
