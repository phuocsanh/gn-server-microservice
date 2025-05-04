package product

import (
	"gn-farm-go-server/internal/controller/product"
	"gn-farm-go-server/internal/middlewares"

	"github.com/gin-gonic/gin"
)

type ProductRouter struct{}

func (pr *ProductRouter) InitProductRouter(Router *gin.RouterGroup) {
	// Public routes
	productRouterPublic := Router.Group("/product")
	{
		// Product routes
		productRouterPublic.GET("/search", product.Product.SearchProducts)
		productRouterPublic.GET("/filter", product.Product.FilterProducts)
		productRouterPublic.GET("/stats", product.Product.GetProductStats)
		productRouterPublic.GET("/:id", product.Product.GetProduct)
		productRouterPublic.GET("", product.Product.ListProducts)

		// Mushroom routes
		productRouterPublic.GET("/mushroom/:id", product.Mushroom.GetMushroom)

		// Vegetable routes
		productRouterPublic.GET("/vegetable/:id", product.Vegetable.GetVegetable)

		// Bonsai routes
		productRouterPublic.GET("/bonsai/:id", product.Bonsai.GetBonsai)
	}

	// Private routes (requires authentication)
	productRouterPrivate := Router.Group("/product")
	productRouterPrivate.Use(middlewares.AuthenMiddleware())
	{
		// Product routes
		productRouterPrivate.POST("", product.Product.CreateProduct)
		productRouterPrivate.PUT("/:id", product.Product.UpdateProduct)
		productRouterPrivate.DELETE("/:id", product.Product.DeleteProduct)
		productRouterPrivate.POST("/bulk-update", product.Product.BulkUpdateProducts)

		// Mushroom routes
		productRouterPrivate.POST("/mushroom", product.Mushroom.CreateMushroom)
		productRouterPrivate.PUT("/mushroom/:id", product.Mushroom.UpdateMushroom)
		productRouterPrivate.DELETE("/mushroom/:id", product.Mushroom.DeleteMushroom)

		// Vegetable routes
		productRouterPrivate.POST("/vegetable", product.Vegetable.CreateVegetable)
		productRouterPrivate.PUT("/vegetable/:id", product.Vegetable.UpdateVegetable)
		productRouterPrivate.DELETE("/vegetable/:id", product.Vegetable.DeleteVegetable)

		// Bonsai routes
		productRouterPrivate.POST("/bonsai", product.Bonsai.CreateBonsai)
		productRouterPrivate.PUT("/bonsai/:id", product.Bonsai.UpdateBonsai)
		productRouterPrivate.DELETE("/bonsai/:id", product.Bonsai.DeleteBonsai)
	}
} 