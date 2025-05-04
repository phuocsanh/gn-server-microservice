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

		// Các route cho Mushroom, Vegetable, và Bonsai đã được loại bỏ
		// vì chúng nên được xử lý như các product_type thông qua ProductTypeController

		// Product Type routes
		productRouterPublic.GET("/type", product.ProductType.ListProductTypes)
		productRouterPublic.GET("/type/:id", product.ProductType.GetProductType)
		productRouterPublic.GET("/type/:typeId/subtypes", product.ProductSubtype.ListProductSubtypesByType)

		// Product Subtype routes
		productRouterPublic.GET("/subtype", product.ProductSubtype.ListProductSubtypes)
		productRouterPublic.GET("/subtype/:id", product.ProductSubtype.GetProductSubtype)

		// Product Subtype Relations routes
		productRouterPublic.GET("/:productId/subtypes", product.ProductSubtypeRelation.GetProductSubtypeRelations)
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

		// Các route cho Mushroom, Vegetable, và Bonsai đã được loại bỏ
		// vì chúng nên được xử lý như các product_type thông qua ProductTypeController

		// Product Type routes
		productRouterPrivate.POST("/type", product.ProductType.CreateProductType)
		productRouterPrivate.PUT("/type/:id", product.ProductType.UpdateProductType)
		productRouterPrivate.DELETE("/type/:id", product.ProductType.DeleteProductType)

		// Product Subtype routes
		productRouterPrivate.POST("/subtype", product.ProductSubtype.CreateProductSubtype)
		productRouterPrivate.PUT("/subtype/:id", product.ProductSubtype.UpdateProductSubtype)
		productRouterPrivate.DELETE("/subtype/:id", product.ProductSubtype.DeleteProductSubtype)
		productRouterPrivate.POST("/subtype/mapping", product.ProductSubtype.AddProductSubtypeMapping)
		productRouterPrivate.DELETE("/subtype/mapping", product.ProductSubtype.RemoveProductSubtypeMapping)

		// Product Subtype Relations routes
		productRouterPrivate.POST("/:productId/subtype/:subtypeId", product.ProductSubtypeRelation.AddProductSubtypeRelation)
		productRouterPrivate.DELETE("/:productId/subtype/:subtypeId", product.ProductSubtypeRelation.RemoveProductSubtypeRelation)
		productRouterPrivate.DELETE("/:productId/subtypes", product.ProductSubtypeRelation.RemoveAllProductSubtypeRelations)
	}
}