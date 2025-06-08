package product

import (
	"gn-farm-go-server/internal/controller/product"

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
		productRouterPublic.GET("/type/:id/subtypes", product.ProductSubtype.ListProductSubtypesByType)

		// Product Subtype routes
		productRouterPublic.GET("/subtype", product.ProductSubtype.ListProductSubtypes)
		productRouterPublic.GET("/subtype/:id", product.ProductSubtype.GetProductSubtype)

		// Product Subtype Relations routes
		productRouterPublic.GET("/:id/subtypes", product.ProductSubtypeRelation.GetProductSubtypeRelations)
	}

	// Lưu ý: Các API private đã được chuyển sang manage/product.router.go
	// với đường dẫn /admin/product/...
}