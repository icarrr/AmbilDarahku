package seed

import (
	"log"
	"time"

	"github.com/icarrr/ambildarahku-backend/internal/config"
	"github.com/icarrr/ambildarahku-backend/internal/models"
	"github.com/icarrr/ambildarahku-backend/internal/repositories"
	"github.com/icarrr/ambildarahku-backend/pkg/utils"
)

func SeedAdmin(cfg *config.Config, userRepo *repositories.UserRepository) {
	if cfg.SeedAdminEmail == "" || cfg.SeedAdminPassword == "" {
		return
	}

	existing, err := userRepo.FindByEmail(cfg.SeedAdminEmail)
	if err != nil {
		log.Printf("warning: failed checking admin user: %v", err)
		return
	}

	if existing != nil {
		log.Printf("admin user already exists: %s", cfg.SeedAdminEmail)
		return
	}

	hash, err := utils.HashPassword(cfg.SeedAdminPassword)
	if err != nil {
		log.Printf("warning: failed to hash admin password: %v", err)
		return
	}

	phone := cfg.SeedAdminPhone
	if phone == "" {
		phone = "6280000000000"
	}

	admin := &models.User{
		FullName:           "Super Admin",
		Phone:              phone,
		Email:              cfg.SeedAdminEmail,
		PasswordHash:       hash,
		Role:               "super_admin",
		DateOfBirth:        time.Date(1990, 1, 1, 0, 0, 0, 0, time.UTC),
		Gender:             "male",
		BloodType:          "O",
		Rhesus:             "+",
		WeightKg:           70,
		HeightCm:           170,
		Province:           "Indonesia",
		City:               "Jakarta",
		District:           "Jakarta Pusat",
		Latitude:           -6.2088,
		Longitude:          106.8456,
		Username:           stringPtr("admin"),
		AvailabilityMode:   "automatic",
		AvailabilityStatus: "available",
		EligibilityStatus:  "eligible",
		EmailVerified:      true,
	}

	if err := userRepo.Create(admin); err != nil {
		log.Printf("warning: failed to seed admin: %v", err)
		return
	}

	log.Printf("admin user created: %s / %s (role: %s)", admin.Email, cfg.SeedAdminPassword, admin.Role)
}

func stringPtr(s string) *string {
	return &s
}
