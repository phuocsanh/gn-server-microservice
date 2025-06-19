package routers

import (
	"gn-farm-go-server/internal/controller"
	"gn-farm-go-server/internal/routers/manage"
	"gn-farm-go-server/internal/routers/product"
	"gn-farm-go-server/internal/routers/user"
	"log"

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
		manageRouterGroup := manage.ManageRouterGroup{}
		
		// Initialize product manage routes
		manageRouterGroup.ProductManageRouter.InitProductManageRouter(v1)

		// Initialize inventory manage routes with error handling
		func() {
			defer func() {
				if r := recover(); r != nil {
					log.Printf("PANIC when initializing inventory router: %v", r)
				}
			}()
			
			log.Println("INIT: About to initialize inventory router...")
			manageRouterGroup.InventoryManageRouter.InitInventoryManageRouter(v1)
			log.Println("INIT: Inventory router initialized successfully")
		}()
	}

	return r
}
