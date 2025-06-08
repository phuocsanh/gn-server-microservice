package manage

import (
	"gn-farm-go-server/internal/controller/product"
	"gn-farm-go-server/internal/middlewares"

	"github.com/gin-gonic/gin"
)

type ProductManageRouter struct{}

func (pr *ProductManageRouter) InitProductManageRouter(Router *gin.RouterGroup) {
	// Private routes (requires authentication)
	productRouterPrivate := Router.Group("/admin/product")
	productRouterPrivate.Use(middlewares.AuthenMiddleware())
	{
		// Product routes
		productRouterPrivate.POST("", product.Product.CreateProduct)
		productRouterPrivate.PUT("/:id", product.Product.UpdateProduct)
		productRouterPrivate.DELETE("/:id", product.Product.DeleteProduct)
		productRouterPrivate.POST("/bulk-update", product.Product.BulkUpdateProducts)

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
		productRouterPrivate.POST("/:id/subtype/:subtypeId", product.ProductSubtypeRelation.AddProductSubtypeRelation)
		productRouterPrivate.DELETE("/:id/subtype/:subtypeId", product.ProductSubtypeRelation.RemoveProductSubtypeRelation)
		productRouterPrivate.DELETE("/:id/subtypes", product.ProductSubtypeRelation.RemoveAllProductSubtypeRelations)
	}
}
