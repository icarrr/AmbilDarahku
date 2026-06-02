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
	passportRepo := repositories.NewDonorPassportRepository(db)
	claimRepo := repositories.NewDonationClaimRepository(db)
	verifRepo := repositories.NewDonorVerificationRepository(db)
	titleRepo := repositories.NewUserTitleRepository(db)
	configRepo := repositories.NewAwardConfigRepository(db)

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
	passportHandler := handlers.NewPassportHandler(passportRepo, userRepo, badgeRepo)
	claimHandler := handlers.NewClaimHandler(claimRepo, userRepo)
	verificationHandler := handlers.NewVerificationHandler(verifRepo, userRepo)
	timelineHandler := handlers.NewTimelineHandler(verifRepo)
	recognitionHandler := handlers.NewRecognitionHandler(userRepo, badgeRepo, titleRepo, configRepo, passportRepo)
	adminHandler := handlers.NewAdminHandler(db, claimRepo, verifRepo, userRepo)
	trustSvc := services.NewTrustService(db)
	trustHandler := handlers.NewTrustHandler(trustSvc, userRepo)
	analyticsHandler := handlers.NewAnalyticsHandler(db, userRepo, trustSvc)

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

		api.GET("/leaderboard/national", leaderboardHandler.National)
		api.GET("/leaderboard/regional", leaderboardHandler.Regional)
		api.GET("/events", eventHandler.List)
		api.GET("/passport/verify/:token", passportHandler.VerifyByQR)
		api.GET("/passport/:username", passportHandler.GetPassportByUsername)
		api.GET("/timeline/:username", timelineHandler.GetPublicTimeline)
		api.GET("/recognition/:username", recognitionHandler.GetPublicPortfolio)
		api.GET("/trust-score/:username", trustHandler.GetPublicTrustScore)

		auth := api.Group("")
		auth.Use(middleware.AuthRequired(cfg.JWTSecret))
		{
			auth.GET("/donors", searchHandler.Search)
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

				verified.GET("/donor-verification", verificationHandler.GetMyVerification)
				verified.POST("/donor-verification", verificationHandler.SubmitVerification)
				verified.GET("/recognition", recognitionHandler.GetPortfolio)
				verified.GET("/timeline", timelineHandler.GetMyTimeline)

				verified.GET("/passport", passportHandler.GetMyPassport)
				verified.POST("/passport/request", passportHandler.RequestPassport)
				verified.POST("/passport/renew", passportHandler.RenewPassport)

				verified.GET("/trust-score", trustHandler.GetOwnTrustScore)
				verified.POST("/trust-score/refresh", trustHandler.RefreshTrustScore)

				verified.GET("/claims", claimHandler.ListMyClaims)
				verified.POST("/claims", claimHandler.CreateClaim)
				verified.GET("/claims/:id", claimHandler.GetClaim)
				verified.PUT("/claims/:id", claimHandler.UpdateClaim)
				verified.DELETE("/claims/:id", claimHandler.CancelClaim)

				admin := verified.Group("")
				admin.Use(middleware.AdminRequired())
				{
					admin.GET("/admin/users", userHandler.ListAll)
					admin.PUT("/admin/users/:id/role", userHandler.UpdateUserRole)
					admin.POST("/events", eventHandler.Create)
					admin.GET("/admin/awards", recognitionHandler.ListAwardConfigs)
					admin.POST("/admin/awards", recognitionHandler.CreateAwardConfig)
					admin.PUT("/admin/awards/:id", recognitionHandler.UpdateAwardConfig)
					admin.DELETE("/admin/awards/:id", recognitionHandler.DeleteAwardConfig)
					admin.POST("/admin/titles", recognitionHandler.AwardTitle)
					admin.GET("/admin/titles", recognitionHandler.ListAllTitles)
				}

				pmi := verified.Group("")
				pmi.Use(middleware.PMIOrAdminRequired())
				{
					pmi.GET("/admin/stats", adminHandler.GetStats)
					pmi.GET("/admin/claims", adminHandler.ListPendingClaims)
					pmi.GET("/admin/claims/:id", adminHandler.GetClaimDetail)
					pmi.PUT("/admin/claims/:id/review", claimHandler.ReviewClaim)
					pmi.GET("/admin/verifications", adminHandler.ListPendingVerifications)
					pmi.PUT("/admin/verifications/:id/review", verificationHandler.ReviewVerification)

					pmi.GET("/admin/analytics/institutions", analyticsHandler.GetDonationsByInstitution)
					pmi.GET("/admin/analytics/cities", analyticsHandler.GetDonationsByCity)
					pmi.GET("/admin/analytics/years", analyticsHandler.GetDonationsByYear)
					pmi.GET("/admin/analytics/months", analyticsHandler.GetDonationsByMonth)
					pmi.GET("/admin/analytics/age", analyticsHandler.GetAgeDistribution)
					pmi.GET("/admin/analytics/top-donors", analyticsHandler.GetTopDonors)
				}
			}
		}
	}

	return r
}
