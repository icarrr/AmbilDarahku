package handlers

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"math/big"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/icarrr/ambildarahku-backend/internal/models"
	"github.com/icarrr/ambildarahku-backend/internal/repositories"
)

type PassportHandler struct {
	passportRepo *repositories.DonorPassportRepository
	userRepo     *repositories.UserRepository
	badgeRepo    *repositories.BadgeRepository
}

func NewPassportHandler(passportRepo *repositories.DonorPassportRepository, userRepo *repositories.UserRepository, badgeRepo *repositories.BadgeRepository) *PassportHandler {
	return &PassportHandler{passportRepo: passportRepo, userRepo: userRepo, badgeRepo: badgeRepo}
}

func generatePassportNumber() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("ADK-%d-%06d", time.Now().Year(), n.Int64()), nil
}

func generateQRToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func (h *PassportHandler) GetMyPassport(c *gin.Context) {
	userID, _ := c.Get("user_id")

	passport, err := h.passportRepo.FindByUserID(userID.(string))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "passport not found, please request one"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch passport"})
		return
	}

	user, _ := h.userRepo.FindByID(userID.(string))
	badges, _ := h.badgeRepo.FindByUserID(userID.(string))
	if badges == nil {
		badges = []*models.UserBadge{}
	}

	c.JSON(http.StatusOK, gin.H{
		"passport": passport,
		"user":     user,
		"badges":   badges,
	})
}

func (h *PassportHandler) GetPassportByUsername(c *gin.Context) {
	username := c.Param("username")

	user, err := h.userRepo.FindByUsername(username)
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	passport, err := h.passportRepo.FindByUserID(user.ID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "passport not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch passport"})
		return
	}

	badges, _ := h.badgeRepo.FindByUserID(user.ID)
	if badges == nil {
		badges = []*models.UserBadge{}
	}

	c.JSON(http.StatusOK, gin.H{
		"passport": passport,
		"user":     user,
		"badges":   badges,
	})
}

func (h *PassportHandler) VerifyByQR(c *gin.Context) {
	token := c.Param("token")

	passport, err := h.passportRepo.FindByQRToken(token)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"valid": false, "error": "invalid QR token"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "verification failed"})
		return
	}

	if !passport.IsActive {
		c.JSON(http.StatusOK, gin.H{"valid": false, "error": "passport is inactive"})
		return
	}

	user, _ := h.userRepo.FindByID(passport.UserID)

	c.JSON(http.StatusOK, gin.H{
		"valid":          true,
		"passport_number": passport.PassportNumber,
		"issued_at":      passport.IssuedAt,
		"donor":          user,
	})
}

func (h *PassportHandler) RequestPassport(c *gin.Context) {
	userID, _ := c.Get("user_id")

	existing, err := h.passportRepo.FindByUserID(userID.(string))
	if err == nil && existing != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "passport already exists", "passport": existing})
		return
	}

	passportNum, err := generatePassportNumber()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate passport number"})
		return
	}

	qrToken, err := generateQRToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate QR token"})
		return
	}

	passport := &models.DonorPassport{
		UserID:         userID.(string),
		PassportNumber: passportNum,
		QrToken:        qrToken,
		IssuedAt:       time.Now(),
		IsActive:       true,
	}

	if err := h.passportRepo.Create(passport); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create passport"})
		return
	}

	_ = h.userRepo.SetNationalDonorID(userID.(string), passportNum)

	c.JSON(http.StatusCreated, gin.H{"passport": passport})
}

func (h *PassportHandler) RenewPassport(c *gin.Context) {
	userID, _ := c.Get("user_id")

	passport, err := h.passportRepo.FindByUserID(userID.(string))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "passport not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch passport"})
		return
	}

	now := time.Now()
	passport.LastRenewedAt = &now

	if err := h.passportRepo.Update(passport); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to renew passport"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"passport": passport})
}
