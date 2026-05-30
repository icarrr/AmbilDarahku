package services

import (
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
	cfg            *config.Config
}

func NewAuthService(
	userRepo *repositories.UserRepository,
	refreshRepo *repositories.RefreshTokenRepository,
	badgeRepo *repositories.BadgeRepository,
	cfg *config.Config,
) *AuthService {
	return &AuthService{
		userRepo:    userRepo,
		refreshRepo: refreshRepo,
		badgeRepo:   badgeRepo,
		cfg:         cfg,
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
		FullName:   input.FullName,
		Phone:      input.Phone,
		Email:      input.Email,
		PasswordHash: hash,
		DateOfBirth: input.DateOfBirth,
		Gender:     input.Gender,
		BloodType:  input.BloodType,
		Rhesus:     input.Rhesus,
		WeightKg:   input.WeightKg,
		HeightCm:   input.HeightCm,
		Province:   input.Province,
		City:       input.City,
		District:   input.District,
		Latitude:   input.Latitude,
		Longitude:  input.Longitude,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, errors.New("failed to create user")
	}

	accessToken, err := utils.GenerateAccessToken(user.ID, user.Email, s.cfg.JWTSecret, s.cfg.JWTAccessExpiry)
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

	accessToken, err := utils.GenerateAccessToken(user.ID, user.Email, s.cfg.JWTSecret, s.cfg.JWTAccessExpiry)
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

	accessToken, err := utils.GenerateAccessToken(user.ID, user.Email, s.cfg.JWTSecret, s.cfg.JWTAccessExpiry)
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
