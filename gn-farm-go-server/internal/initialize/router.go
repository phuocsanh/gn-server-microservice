package initialize

import (
	"gn-farm-go-server/global"
	"gn-farm-go-server/internal/controller/health"
	"gn-farm-go-server/internal/handler/upload"
	"gn-farm-go-server/internal/middlewares"
	"gn-farm-go-server/internal/routers"
	"gn-farm-go-server/internal/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func InitRouter() *gin.Engine {
	var r *gin.Engine
	if global.Config.Server.Mode == "dev" {
		gin.SetMode(gin.DebugMode)
		gin.ForceConsoleColor()
		r = gin.Default()
	} else {
		gin.SetMode(gin.ReleaseMode)
		r = gin.New()
	}

	// Cấu hình static file
	r.Static("/uploads", "./uploads")
	r.MaxMultipartMemory = 8 << 20 // 8 MiB
	// middlewares
	r.Use(middlewares.ErrorHandler())
	r.Use(middlewares.LoggingMiddleware())
	r.Use(middlewares.RequestResponseLoggingMiddleware())
	
	// CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"*"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false,
	}))

	// Initialize routers
	manageRouter := routers.RouterGroupApp.Manage
	userRouterGroup := routers.RouterGroupApp.User
	productRouterGroup := routers.RouterGroupApp.Product

	// Initialize upload handler
	uploadHandler := upload.NewUploadHandler(service.Upload())
	uploadRouter := routers.NewUploadRouter(uploadHandler)

	// Health check endpoints (outside versioned API)
	r.GET("/health", health.Health.HealthCheck)
	r.GET("/ready", health.Health.ReadinessCheck)
	r.GET("/live", health.Health.LivenessCheck)

	// API v1 group
	v1 := r.Group("/v1")
	{
		// Health check
		v1.GET("/checkStatus", health.Health.HealthCheck)

		// User routes
		userRouterGroup.InitUserRouter(v1)

		// Product routes
		productRouterGroup.InitProductRouter(v1)

		// Manage routes
		manageRouter.InitUserRouter(v1)
		manageRouter.InitAdminRouter(v1)
		manageRouter.InitInventoryManageRouter(v1)
		manageRouter.InitProductManageRouter(v1)

		// Upload routes
		uploadRouter.InitRouter(v1)
	}

	return r
}
