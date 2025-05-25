package initialize

import (
	"gn-farm-go-server/global"
	"gn-farm-go-server/internal/controller/health"
	"gn-farm-go-server/internal/middlewares"
	"gn-farm-go-server/internal/routers"

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
	// middlewares
	r.Use(middlewares.ErrorHandler())
	r.Use(middlewares.LoggingMiddleware())
	r.Use(middlewares.RequestResponseLoggingMiddleware())
	// r.Use() // cross
	// r.Use() // limiter global
	manageRouter := routers.RouterGroupApp.Manage
	userRouterGroup := routers.RouterGroupApp.User
	productRouterGroup := routers.RouterGroupApp.Product

	// Health check endpoints (outside versioned API)
	r.GET("/health", health.Health.HealthCheck)
	r.GET("/ready", health.Health.ReadinessCheck)
	r.GET("/live", health.Health.LivenessCheck)

	MainGroup := r.Group("/v1")
	{
		MainGroup.GET("/checkStatus") // tracking monitor
	}
	{
		userRouterGroup.InitUserRouter(MainGroup)
	}
	{
		productRouterGroup.InitProductRouter(MainGroup)
	}
	{
		manageRouter.InitUserRouter(MainGroup)
		manageRouter.InitAdminRouter(MainGroup)
	}

	return r
}
