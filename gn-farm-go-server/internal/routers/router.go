package routers

import (
	"gn-farm-go-server/internal/routers/product"
	"gn-farm-go-server/internal/routers/user"

	"github.com/gin-gonic/gin"
)

func NewRouter() *gin.Engine {
	r := gin.Default()

	// API v1 group
	v1 := r.Group("/api/v1")
	{
		// Initialize user routes
		userRouter := user.UserRouter{}
		userRouter.InitUserRouter(v1)

		// Initialize product routes
		productRouter := product.ProductRouter{}
		productRouter.InitProductRouter(v1)
	}

	return r
}
