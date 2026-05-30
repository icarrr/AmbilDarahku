package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"

	"github.com/icarrr/ambildarahku-backend/internal/config"
	"github.com/icarrr/ambildarahku-backend/internal/handlers"
	"github.com/icarrr/ambildarahku-backend/internal/middleware"
	"github.com/icarrr/ambildarahku-backend/internal/repositories"
	"github.com/icarrr/ambildarahku-backend/internal/services"
)

func Setup(cfg *config.Config, db *sqlx.DB) *gin.Engine {
	r := gin.Default()

	r.Use(middleware.CORS())

	userRepo := repositories.NewUserRepository(db)
	historyRepo := repositories.NewDonorHistoryRepository(db)
	requestRepo := repositories.NewBloodRequestRepository(db)
	badgeRepo := repositories.NewBadgeRepository(db)
	refreshRepo := repositories.NewRefreshTokenRepository(db)

	authService := services.NewAuthService(userRepo, refreshRepo, badgeRepo, cfg)
	statusService := services.NewDonorStatusService(userRepo)

	authHandler := handlers.NewAuthHandler(authService)
	userHandler := handlers.NewUserHandler(userRepo, badgeRepo)
	historyHandler := handlers.NewDonorHistoryHandler(historyRepo)
	requestHandler := handlers.NewBloodRequestHandler(requestRepo)
	searchHandler := handlers.NewSearchHandler(userRepo)
	leaderboardHandler := handlers.NewLeaderboardHandler(db)
	statusHandler := handlers.NewDonorStatusHandler(statusService)

	api := r.Group("/api/v1")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok"})
		})

		api.POST("/auth/register", authHandler.Register)
		api.POST("/auth/login", authHandler.Login)
		api.POST("/auth/refresh", authHandler.RefreshToken)

		api.GET("/u/:username", userHandler.GetPublicProfile)
		api.GET("/requests", requestHandler.ListOpen)
		api.GET("/donors", searchHandler.Search)
		api.GET("/leaderboard/national", leaderboardHandler.National)
		api.GET("/leaderboard/regional", leaderboardHandler.Regional)

		auth := api.Group("")
		auth.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			auth.GET("/auth/me", userHandler.GetProfile)
			auth.PUT("/auth/me", userHandler.UpdateProfile)
			auth.POST("/auth/logout", authHandler.Logout)

			auth.GET("/donor-history", historyHandler.List)
			auth.POST("/donor-history", historyHandler.Create)

			auth.POST("/requests", requestHandler.Create)
			auth.GET("/requests/mine", requestHandler.MyRequests)
			auth.PUT("/requests/:id/status", requestHandler.UpdateStatus)

			auth.GET("/donor-status", statusHandler.GetStatus)
			auth.PUT("/donor-status", statusHandler.UpdateStatus)
		}
	}

	return r
}
