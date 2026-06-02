package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/icarrr/ambildarahku-backend/internal/models"
	"github.com/icarrr/ambildarahku-backend/internal/repositories"
)

type RecognitionHandler struct {
	userRepo    *repositories.UserRepository
	badgeRepo   *repositories.BadgeRepository
	titleRepo   *repositories.UserTitleRepository
	configRepo  *repositories.AwardConfigRepository
	passportRepo *repositories.DonorPassportRepository
}

func NewRecognitionHandler(
	userRepo *repositories.UserRepository,
	badgeRepo *repositories.BadgeRepository,
	titleRepo *repositories.UserTitleRepository,
	configRepo *repositories.AwardConfigRepository,
	passportRepo *repositories.DonorPassportRepository,
) *RecognitionHandler {
	return &RecognitionHandler{
		userRepo:    userRepo,
		badgeRepo:   badgeRepo,
		titleRepo:   titleRepo,
		configRepo:  configRepo,
		passportRepo: passportRepo,
	}
}

func (h *RecognitionHandler) GetPortfolio(c *gin.Context) {
	userID, _ := c.Get("user_id")

	user, err := h.userRepo.FindByID(userID.(string))
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	badges, _ := h.badgeRepo.FindByUserID(user.ID)
	if badges == nil {
		badges = []*models.UserBadge{}
	}

	titles, _ := h.titleRepo.FindByUserID(user.ID)
	if titles == nil {
		titles = []*models.UserTitle{}
	}

	passport, _ := h.passportRepo.FindByUserID(user.ID)

	c.JSON(http.StatusOK, gin.H{
		"user":     user,
		"badges":   badges,
		"titles":   titles,
		"passport": passport,
	})
}

func (h *RecognitionHandler) GetPublicPortfolio(c *gin.Context) {
	username := c.Param("username")

	user, err := h.userRepo.FindByUsername(username)
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	badges, _ := h.badgeRepo.FindByUserID(user.ID)
	if badges == nil {
		badges = []*models.UserBadge{}
	}

	titles, _ := h.titleRepo.FindByUserID(user.ID)
	if titles == nil {
		titles = []*models.UserTitle{}
	}

	passport, _ := h.passportRepo.FindByUserID(user.ID)

	c.JSON(http.StatusOK, gin.H{
		"user":     user,
		"badges":   badges,
		"titles":   titles,
		"passport": passport,
	})
}

// Admin: manage award configs

func (h *RecognitionHandler) ListAwardConfigs(c *gin.Context) {
	configs, err := h.configRepo.FindAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch configs"})
		return
	}
	if configs == nil {
		configs = []*models.AwardConfig{}
	}
	c.JSON(http.StatusOK, gin.H{"configs": configs})
}

type CreateAwardConfigInput struct {
	Name        string  `json:"name" binding:"required"`
	Description *string `json:"description,omitempty"`
	AwardType   string  `json:"award_type" binding:"required"`
	Criteria    string  `json:"criteria"`
	Scope       string  `json:"scope" binding:"required"`
	ScopeValue  *string `json:"scope_value,omitempty"`
	IsActive    *bool   `json:"is_active"`
}

func (h *RecognitionHandler) CreateAwardConfig(c *gin.Context) {
	var input CreateAwardConfigInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input: " + err.Error()})
		return
	}

	criteria := input.Criteria
	if criteria == "" {
		criteria = "{}"
	}
	if !json.Valid([]byte(criteria)) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "criteria must be valid JSON"})
		return
	}

	isActive := true
	if input.IsActive != nil {
		isActive = *input.IsActive
	}

	config := &models.AwardConfig{
		Name:        input.Name,
		Description: input.Description,
		AwardType:   input.AwardType,
		Criteria:    criteria,
		Scope:       input.Scope,
		ScopeValue:  input.ScopeValue,
		IsActive:    isActive,
	}

	if err := h.configRepo.Create(config); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create config"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"config": config})
}

type UpdateAwardConfigInput struct {
	Name        *string `json:"name,omitempty"`
	Description *string `json:"description,omitempty"`
	AwardType   *string `json:"award_type,omitempty"`
	Criteria    *string `json:"criteria,omitempty"`
	Scope       *string `json:"scope,omitempty"`
	ScopeValue  *string `json:"scope_value,omitempty"`
	IsActive    *bool   `json:"is_active,omitempty"`
}

func (h *RecognitionHandler) UpdateAwardConfig(c *gin.Context) {
	id := c.Param("id")

	existing, err := h.configRepo.FindByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "config not found"})
		return
	}

	var input UpdateAwardConfigInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input: " + err.Error()})
		return
	}

	if input.Name != nil {
		existing.Name = *input.Name
	}
	if input.Description != nil {
		existing.Description = input.Description
	}
	if input.AwardType != nil {
		existing.AwardType = *input.AwardType
	}
	if input.Criteria != nil {
		if !json.Valid([]byte(*input.Criteria)) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "criteria must be valid JSON"})
			return
		}
		existing.Criteria = *input.Criteria
	}
	if input.Scope != nil {
		existing.Scope = *input.Scope
	}
	if input.ScopeValue != nil {
		existing.ScopeValue = input.ScopeValue
	}
	if input.IsActive != nil {
		existing.IsActive = *input.IsActive
	}

	if err := h.configRepo.Update(existing); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update config"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"config": existing})
}

func (h *RecognitionHandler) DeleteAwardConfig(c *gin.Context) {
	id := c.Param("id")
	if err := h.configRepo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete config"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "config deleted"})
}

// Admin: manage titles

type AwardTitleInput struct {
	UserID      string  `json:"user_id" binding:"required"`
	Title       string  `json:"title" binding:"required"`
	Description *string `json:"description,omitempty"`
	ConfigID    *string `json:"config_id,omitempty"`
}

func (h *RecognitionHandler) AwardTitle(c *gin.Context) {
	var input AwardTitleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input: " + err.Error()})
		return
	}

	title := &models.UserTitle{
		UserID:      input.UserID,
		Title:       input.Title,
		Source:      "manual",
		ConfigID:    input.ConfigID,
		Description: input.Description,
	}

	if err := h.titleRepo.Create(title); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to award title"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"title": title})
}

func (h *RecognitionHandler) ListAllTitles(c *gin.Context) {
	titles, err := h.titleRepo.FindAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch titles"})
		return
	}
	if titles == nil {
		titles = []*models.UserTitle{}
	}
	c.JSON(http.StatusOK, gin.H{"titles": titles})
}
