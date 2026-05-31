package services

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"github.com/icarrr/ambildarahku-backend/internal/config"
	"github.com/icarrr/ambildarahku-backend/internal/models"
	"github.com/icarrr/ambildarahku-backend/internal/repositories"
	"github.com/icarrr/ambildarahku-backend/pkg/utils"
)

type AuthService struct {
	userRepo       *repositories.UserRepository
	refreshRepo    *repositories.RefreshTokenRepository
	badgeRepo      *repositories.BadgeRepository
	verifTokenRepo *repositories.VerificationTokenRepository
	emailSvc       *EmailService
	cfg            *config.Config
}

func NewAuthService(
	userRepo *repositories.UserRepository,
	refreshRepo *repositories.RefreshTokenRepository,
	badgeRepo *repositories.BadgeRepository,
	verifTokenRepo *repositories.VerificationTokenRepository,
	emailSvc *EmailService,
	cfg *config.Config,
) *AuthService {
	return &AuthService{
		userRepo:       userRepo,
		refreshRepo:    refreshRepo,
		badgeRepo:      badgeRepo,
		verifTokenRepo: verifTokenRepo,
		emailSvc:       emailSvc,
		cfg:            cfg,
	}
}

type RegisterInput struct {
	FullName   string    `json:"full_name"`
	Phone      string    `json:"phone"`
	Email      string    `json:"email"`
	Password   string    `json:"password"`
	DateOfBirth time.Time `json:"date_of_birth"`
	Gender     string    `json:"gender"`
	BloodType  string    `json:"blood_type"`
	Rhesus     string    `json:"rhesus"`
	WeightKg   float64   `json:"weight_kg"`
	HeightCm   float64   `json:"height_cm"`
	Province   string    `json:"province"`
	City       string    `json:"city"`
	District   string    `json:"district"`
	Latitude   float64   `json:"latitude"`
	Longitude  float64   `json:"longitude"`
}

type AuthResult struct {
	User         *models.User `json:"user"`
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
}

func generateToken() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func (s *AuthService) Register(input *RegisterInput) (*AuthResult, error) {
	existing, _ := s.userRepo.FindByEmail(input.Email)
	if existing != nil {
		return nil, errors.New("email already registered")
	}

	existing, _ = s.userRepo.FindByPhone(input.Phone)
	if existing != nil {
		return nil, errors.New("phone already registered")
	}

	hash, err := utils.HashPassword(input.Password)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	user := &models.User{
		FullName:     input.FullName,
		Phone:        input.Phone,
		Email:        input.Email,
		PasswordHash: hash,
		DateOfBirth:  input.DateOfBirth,
		Gender:       input.Gender,
		BloodType:    input.BloodType,
		Rhesus:       input.Rhesus,
		WeightKg:     input.WeightKg,
		HeightCm:     input.HeightCm,
		Province:     input.Province,
		City:         input.City,
		District:     input.District,
		Latitude:     input.Latitude,
		Longitude:    input.Longitude,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, errors.New("failed to create user")
	}

	accessToken, err := utils.GenerateAccessToken(user.ID, user.Email, user.Role, s.cfg.JWTSecret, s.cfg.JWTAccessExpiry, user.EmailVerified)
	if err != nil {
		return nil, errors.New("failed to generate access token")
	}

	refreshToken, err := utils.GenerateRefreshToken()
	if err != nil {
		return nil, errors.New("failed to generate refresh token")
	}

	expiresAt := time.Now().Add(s.cfg.JWTRefreshExpiry)
	if err := s.refreshRepo.Create(user.ID, refreshToken, expiresAt.Format(time.RFC3339)); err != nil {
		return nil, errors.New("failed to store refresh token")
	}

	if err := s.sendVerificationEmail(user.ID, user.Email); err != nil {
		return nil, err
	}

	return &AuthResult{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (s *AuthService) Login(input *LoginInput) (*AuthResult, error) {
	user, err := s.userRepo.FindByEmail(input.Email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	if !utils.CheckPassword(input.Password, user.PasswordHash) {
		return nil, errors.New("invalid email or password")
	}

	accessToken, err := utils.GenerateAccessToken(user.ID, user.Email, user.Role, s.cfg.JWTSecret, s.cfg.JWTAccessExpiry, user.EmailVerified)
	if err != nil {
		return nil, errors.New("failed to generate access token")
	}

	refreshToken, err := utils.GenerateRefreshToken()
	if err != nil {
		return nil, errors.New("failed to generate refresh token")
	}

	expiresAt := time.Now().Add(s.cfg.JWTRefreshExpiry)
	if err := s.refreshRepo.Create(user.ID, refreshToken, expiresAt.Format(time.RFC3339)); err != nil {
		return nil, errors.New("failed to store refresh token")
	}

	return &AuthResult{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *AuthService) RefreshToken(refreshToken string) (*AuthResult, error) {
	stored, err := s.refreshRepo.FindByToken(refreshToken)
	if err != nil {
		return nil, errors.New("invalid or expired refresh token")
	}

	user, err := s.userRepo.FindByID(stored.UserID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if err := s.refreshRepo.DeleteByToken(refreshToken); err != nil {
		return nil, errors.New("failed to rotate refresh token")
	}

	accessToken, err := utils.GenerateAccessToken(user.ID, user.Email, user.Role, s.cfg.JWTSecret, s.cfg.JWTAccessExpiry, user.EmailVerified)
	if err != nil {
		return nil, errors.New("failed to generate access token")
	}

	newRefreshToken, err := utils.GenerateRefreshToken()
	if err != nil {
		return nil, errors.New("failed to generate refresh token")
	}

	expiresAt := time.Now().Add(s.cfg.JWTRefreshExpiry)
	if err := s.refreshRepo.Create(user.ID, newRefreshToken, expiresAt.Format(time.RFC3339)); err != nil {
		return nil, errors.New("failed to store refresh token")
	}

	return &AuthResult{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
	}, nil
}

func (s *AuthService) Logout(userID string) error {
	return s.refreshRepo.DeleteByUserID(userID)
}

func (s *AuthService) sendVerificationEmail(userID, email string) error {
	token, err := generateToken()
	if err != nil {
		return errors.New("failed to generate verification token")
	}

	s.verifTokenRepo.DeleteByUserID(userID, "email_verification")

	vt := &models.VerificationToken{
		UserID:    userID,
		Token:     token,
		Type:      "email_verification",
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}
	if err := s.verifTokenRepo.Create(vt); err != nil {
		return errors.New("failed to store verification token")
	}

	if err := s.emailSvc.SendVerificationEmail(email, token); err != nil {
		return nil
	}
	return nil
}

func (s *AuthService) VerifyEmail(token string) (*AuthResult, error) {
	t, err := s.verifTokenRepo.FindByToken(token, "email_verification")
	if err != nil {
		return nil, errors.New("failed to verify token")
	}
	if t == nil {
		return nil, errors.New("invalid or expired verification token")
	}

	user, err := s.userRepo.FindByID(t.UserID)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}

	if user.EmailVerified {
		return nil, errors.New("email already verified")
	}

	if err := s.userRepo.UpdateEmailVerified(t.UserID, true); err != nil {
		return nil, errors.New("failed to verify email")
	}

	if err := s.verifTokenRepo.MarkUsed(t.ID); err != nil {
		return nil, err
	}

	user.EmailVerified = true

	accessToken, err := utils.GenerateAccessToken(user.ID, user.Email, user.Role, s.cfg.JWTSecret, s.cfg.JWTAccessExpiry, true)
	if err != nil {
		return nil, errors.New("failed to generate access token")
	}

	refreshToken, err := utils.GenerateRefreshToken()
	if err != nil {
		return nil, errors.New("failed to generate refresh token")
	}

	expiresAt := time.Now().Add(s.cfg.JWTRefreshExpiry)
	if err := s.refreshRepo.Create(user.ID, refreshToken, expiresAt.Format(time.RFC3339)); err != nil {
		return nil, errors.New("failed to store refresh token")
	}

	return &AuthResult{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *AuthService) ResendVerification(userID string) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil || user == nil {
		return errors.New("user not found")
	}

	if user.EmailVerified {
		return errors.New("email already verified")
	}

	return s.sendVerificationEmail(userID, user.Email)
}

func (s *AuthService) ForgotPassword(email string) error {
	user, err := s.userRepo.FindByEmail(email)
	if err != nil || user == nil {
		return nil
	}

	token, err := generateToken()
	if err != nil {
		return errors.New("failed to generate reset token")
	}

	s.verifTokenRepo.DeleteByUserID(user.ID, "password_reset")

	vt := &models.VerificationToken{
		UserID:    user.ID,
		Token:     token,
		Type:      "password_reset",
		ExpiresAt: time.Now().Add(1 * time.Hour),
	}
	if err := s.verifTokenRepo.Create(vt); err != nil {
		return errors.New("failed to store reset token")
	}

	if err := s.emailSvc.SendPasswordResetEmail(email, token); err != nil {
		return nil
	}
	return nil
}

func (s *AuthService) ResetPassword(token, newPassword string) error {
	t, err := s.verifTokenRepo.FindByToken(token, "password_reset")
	if err != nil {
		return errors.New("failed to verify token")
	}
	if t == nil {
		return errors.New("invalid or expired reset token")
	}

	hash, err := utils.HashPassword(newPassword)
	if err != nil {
		return errors.New("failed to hash password")
	}

	if err := s.userRepo.UpdatePassword(t.UserID, hash); err != nil {
		return errors.New("failed to update password")
	}

	if err := s.verifTokenRepo.MarkUsed(t.ID); err != nil {
		return nil
	}
	return nil
}

func (s *AuthService) ChangePassword(userID, currentPassword, newPassword string) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil || user == nil {
		return errors.New("user not found")
	}

	if !utils.CheckPassword(currentPassword, user.PasswordHash) {
		return errors.New("current password is incorrect")
	}

	hash, err := utils.HashPassword(newPassword)
	if err != nil {
		return errors.New("failed to hash password")
	}

	return s.userRepo.UpdatePassword(userID, hash)
}
