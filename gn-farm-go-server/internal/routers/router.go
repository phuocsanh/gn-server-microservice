package routers

import (
	"gn-farm-go-server/internal/controller"
	"gn-farm-go-server/internal/routers/manage"
	"gn-farm-go-server/internal/routers/product"
	"gn-farm-go-server/internal/routers/user"

	"github.com/gin-gonic/gin"
)

func NewRouter() *gin.Engine {
	r := gin.Default()

	// Health check route
	pongController := controller.NewPongController()
	r.GET("/ping", pongController.Pong)

	// API v1 group
	v1 := r.Group("/api/v1")
	{
		// Health check route in v1
		v1.GET("/ping", pongController.Pong)

		// Initialize user routes
		userRouter := user.UserRouter{}
		userRouter.InitUserRouter(v1)

		// Initialize product routes
		productRouter := product.ProductRouter{}
		productRouter.InitProductRouter(v1)

		// Initialize manage routes
		productManageRouter := manage.ProductManageRouter{}
		productManageRouter.InitProductManageRouter(v1)
	}

	return r
}
