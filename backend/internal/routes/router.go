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
	fulfillRepo := repositories.NewFulfillmentRepository(db)
	badgeRepo := repositories.NewBadgeRepository(db)
	refreshRepo := repositories.NewRefreshTokenRepository(db)
	verifTokenRepo := repositories.NewVerificationTokenRepository(db)

	emailSvc := services.NewEmailService(cfg)
	authService := services.NewAuthService(userRepo, refreshRepo, badgeRepo, verifTokenRepo, emailSvc, cfg)
	statusService := services.NewDonorStatusService(userRepo)

	authHandler := handlers.NewAuthHandler(authService)
	userHandler := handlers.NewUserHandler(userRepo, badgeRepo)
	historyHandler := handlers.NewDonorHistoryHandler(historyRepo, userRepo)
	requestHandler := handlers.NewBloodRequestHandler(requestRepo, fulfillRepo, historyRepo, userRepo)
	searchHandler := handlers.NewSearchHandler(userRepo)
	leaderboardHandler := handlers.NewLeaderboardHandler(db)
	statusHandler := handlers.NewDonorStatusHandler(statusService, userRepo)
	eventRepo := repositories.NewEventRepository(db)
	eventHandler := handlers.NewEventHandler(eventRepo)

	api := r.Group("/api/v1")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok"})
		})

		api.GET("/stats", func(c *gin.Context) {
			var activeDonors, totalDonations, cities int
			db.Get(&activeDonors, "SELECT COUNT(*) FROM users WHERE availability_status = 'available'")
			db.Get(&totalDonations, "SELECT COALESCE(SUM(bags), 0) FROM donor_histories")
			db.Get(&cities, "SELECT COUNT(DISTINCT city) FROM users WHERE city != ''")
			c.JSON(200, gin.H{
				"stats": gin.H{
					"active_donors":     activeDonors,
					"lives_saved":       totalDonations,
					"partner_hospitals": 450,
					"cities_reached":    cities,
				},
			})
		})

		api.POST("/auth/register", authHandler.Register)
		api.POST("/auth/login", authHandler.Login)
		api.POST("/auth/refresh", authHandler.RefreshToken)
		api.POST("/auth/verify-email", authHandler.VerifyEmail)
		api.POST("/auth/forgot-password", authHandler.ForgotPassword)
		api.POST("/auth/reset-password", authHandler.ResetPassword)

		api.GET("/u/:username", userHandler.GetPublicProfile)
		api.GET("/requests", requestHandler.ListOpen)
		api.GET("/requests/:id", requestHandler.GetByID)
		api.GET("/requests/:id/fulfillments", requestHandler.ListFulfillments)

		api.GET("/donors", searchHandler.Search)
		api.GET("/leaderboard/national", leaderboardHandler.National)
		api.GET("/leaderboard/regional", leaderboardHandler.Regional)
		api.GET("/events", eventHandler.List)

		auth := api.Group("")
		auth.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			auth.GET("/auth/me", userHandler.GetProfile)
			auth.PUT("/auth/me", userHandler.UpdateProfile)
			auth.POST("/auth/logout", authHandler.Logout)
			auth.POST("/auth/resend-verification", authHandler.ResendVerification)
			auth.PUT("/auth/change-password", authHandler.ChangePassword)

			verified := auth.Group("")
			verified.Use(middleware.EmailVerifiedRequired())
			{
				verified.GET("/donor-history", historyHandler.List)
				verified.POST("/donor-history", historyHandler.Create)
				verified.PUT("/donor-history/:id", historyHandler.Update)

				verified.POST("/requests", requestHandler.Create)
				verified.GET("/requests/mine", requestHandler.MyRequests)
				verified.PUT("/requests/:id/status", requestHandler.UpdateStatus)
				verified.POST("/requests/:id/fulfill", requestHandler.Fulfill)

				verified.GET("/donor-status", statusHandler.GetStatus)
				verified.PUT("/donor-status", statusHandler.UpdateStatus)

				admin := verified.Group("")
				admin.Use(middleware.AdminRequired())
				{
					admin.GET("/admin/users", userHandler.ListAll)
					admin.PUT("/admin/users/:id/role", userHandler.UpdateUserRole)
					admin.POST("/events", eventHandler.Create)
				}
			}
		}
	}

	return r
}
