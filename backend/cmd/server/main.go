package main

import (
	"log"

	"github.com/icarrr/ambildarahku-backend/internal/config"
	"github.com/icarrr/ambildarahku-backend/internal/database"
	"github.com/icarrr/ambildarahku-backend/internal/repositories"
	"github.com/icarrr/ambildarahku-backend/internal/routes"
	"github.com/icarrr/ambildarahku-backend/internal/seed"
)

func main() {
	cfg := config.Load()

	db := database.NewPostgres(cfg)
	defer db.Close()

	database.RunMigrations(db)

	userRepo := repositories.NewUserRepository(db)
	badgeRepo := repositories.NewBadgeRepository(db)

	if err := badgeRepo.SeedDefaults(); err != nil {
		log.Printf("warning: failed to seed badges: %v", err)
	}

	seed.SeedAdmin(cfg, userRepo)

	if cfg.SeedDummy {
		seed.SeedDummy(db)
	}

	r := routes.Setup(cfg, db)

	addr := ":" + cfg.ServerPort
	log.Printf("server starting on %s (%s)", addr, cfg.ServerEnv)
	if err := r.Run(addr); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
