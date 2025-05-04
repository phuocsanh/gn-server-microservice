package initialize

import (
	"gn-farm-go-server/global"
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
	// r.Use() // logging
	// r.Use() // cross
	// r.Use() // limiter global
	manageRouter := routers.RouterGroupApp.Manage
	userRouterGroup := routers.RouterGroupApp.User
	productRouterGroup := routers.RouterGroupApp.Product

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
