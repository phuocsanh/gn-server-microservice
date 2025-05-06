package product

import (
	"database/sql"
	"fmt"
	"gn-farm-go-server/internal/database"
	"gn-farm-go-server/internal/service"
	"gn-farm-go-server/internal/vo/product"
	"gn-farm-go-server/pkg/response"

	"github.com/gin-gonic/gin"
)

var (
	ErrProductNotFound = fmt.Errorf("product not found")
	ErrInvalidProduct  = fmt.Errorf("invalid product data")
)

// Các struct request cho Mushroom, Vegetable, và Bonsai đã được loại bỏ
// vì chúng nên được xử lý như các product_type thông qua ProductTypeController

var Product = new(productController)

type productController struct{}

// CreateProduct creates a new product
// @Summary      Create a new product
// @Description  Create a new product with the provided details
// @Tags         product management
// @Accept       json
// @Produce      json
// @Param        payload body CreateProductRequest true "Product details"
// @Success      200  {object}  response.ResponseData
// @Failure      400  {object}  response.ErrorResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /product [post]
func (c *productController) CreateProduct(ctx *gin.Context) {
	var req product.CreateProductRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	// Convert from request to database params
	params := database.CreateProductParams{
		ProductName:            req.ProductName,
		ProductPrice:           req.ProductPrice,
		ProductThumb:           req.ProductThumb,
		ProductPictures:        req.ProductPictures,
		ProductVideos:          req.ProductVideos,
		ProductType:            req.ProductType,
		SubProductType:         req.SubProductType,
		ProductDiscountedPrice: req.ProductDiscountedPrice,
		ProductAttributes:      req.ProductAttributes,
		IsDraft:                sql.NullBool{Bool: req.IsDraft, Valid: true},
		IsPublished:            sql.NullBool{Bool: req.IsPublished, Valid: true},
	}

	// Handle optional fields
	if req.ProductStatus != nil {
		params.ProductStatus = sql.NullInt32{Int32: *req.ProductStatus, Valid: true}
	}

	if req.ProductDescription != nil {
		params.ProductDescription = sql.NullString{String: *req.ProductDescription, Valid: true}
	}

	if req.ProductQuantity != nil {
		params.ProductQuantity = sql.NullInt32{Int32: *req.ProductQuantity, Valid: true}
	}

	if req.Discount != nil {
		params.Discount = sql.NullString{String: *req.Discount, Valid: true}
	}

	product, err := service.Product.CreateProduct(ctx, &params)
	if err != nil {
		response.ErrorResponse(ctx, response.ErrCodeInternalServerError, err.Error())
		return
	}

	response.SuccessResponse(ctx, response.ErrCodeSuccess, product)
}

// GetProduct retrieves a product by ID
// @Summary      Get a product by ID
// @Description  Get detailed information about a product by its ID
// @Tags         product management
// @Accept       json
// @Produce      json
// @Param        id path int true "Product ID" example:1
// @Success      200  {object}  response.ResponseData
// @Failure      400  {object}  response.ErrorResponseData
// @Failure      404  {object}  response.ErrorResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /product/{id} [get]
func (c *productController) GetProduct(ctx *gin.Context) {
	var id int32
	if err := ctx.ShouldBindUri(&id); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	product, err := service.Product.GetProduct(ctx, id)
	if err != nil {
		response.ErrorResponse(ctx, response.ErrCodeInternalServerError, err.Error())
		return
	}

	response.SuccessResponse(ctx, response.ErrCodeSuccess, product)
}

// ListProducts retrieves a list of products
// @Summary      List products
// @Description  Get a paginated list of products
// @Tags         product management
// @Accept       json
// @Produce      json
// @Param        limit query int true "Number of items to return" minimum(1) maximum(100) example:10
// @Param        offset query int false "Number of items to skip" minimum(0) default(0) example:0
// @Success      200  {object}  response.ResponseData
// @Failure      400  {object}  response.ErrorResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /product [get]
func (c *productController) ListProducts(ctx *gin.Context) {
	var params struct {
		Query  string `form:"query" binding:"required,min=1"`
		Limit  int32  `form:"limit" binding:"required,min=1,max=100"`
		Offset int32  `form:"offset" binding:"min=0"`
	}
	if err := ctx.ShouldBindQuery(&params); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	products, err := service.Product.SearchProducts(ctx, params.Query, params.Limit, params.Offset)
	if err != nil {
		response.ErrorResponse(ctx, response.ErrCodeInternalServerError, err.Error())
		return
	}

	response.SuccessResponse(ctx, response.ErrCodeSuccess, products)
}

// UpdateProduct updates an existing product
// @Summary      Update a product
// @Description  Update an existing product with the provided details
// @Tags         product management
// @Accept       json
// @Produce      json
// @Param        id path int true "Product ID" example:1
// @Param        payload body UpdateProductRequest true "Updated product details"
// @Success      200  {object}  response.ResponseData
// @Failure      400  {object}  response.ErrorResponseData
// @Failure      404  {object}  response.ErrorResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /product/{id} [put]
func (c *productController) UpdateProduct(ctx *gin.Context) {
	var req product.UpdateProductRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	var id int32
	if err := ctx.ShouldBindUri(&id); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	// Convert from request to database params
	params := database.UpdateProductParams{
		ID:                     id,
		ProductName:            req.ProductName,
		ProductPrice:           req.ProductPrice,
		ProductThumb:           req.ProductThumb,
		ProductPictures:        req.ProductPictures,
		ProductVideos:          req.ProductVideos,
		ProductType:            req.ProductType,
		SubProductType:         req.SubProductType,
		ProductDiscountedPrice: req.ProductDiscountedPrice,
		ProductAttributes:      req.ProductAttributes,
		IsDraft:                sql.NullBool{Bool: req.IsDraft, Valid: true},
		IsPublished:            sql.NullBool{Bool: req.IsPublished, Valid: true},
	}

	// Handle optional fields
	if req.ProductStatus != nil {
		params.ProductStatus = sql.NullInt32{Int32: *req.ProductStatus, Valid: true}
	}

	if req.ProductDescription != nil {
		params.ProductDescription = sql.NullString{String: *req.ProductDescription, Valid: true}
	}

	if req.ProductQuantity != nil {
		params.ProductQuantity = sql.NullInt32{Int32: *req.ProductQuantity, Valid: true}
	}

	if req.Discount != nil {
		params.Discount = sql.NullString{String: *req.Discount, Valid: true}
	}

	product, err := service.Product.UpdateProduct(ctx, &params)
	if err != nil {
		response.ErrorResponse(ctx, response.ErrCodeInternalServerError, err.Error())
		return
	}

	response.SuccessResponse(ctx, response.ErrCodeSuccess, product)
}

// DeleteProduct deletes a product
// @Summary      Delete a product
// @Description  Delete a product by its ID
// @Tags         product management
// @Accept       json
// @Produce      json
// @Param        id path int true "Product ID" example:1
// @Success      200  {object}  response.ResponseData
// @Failure      400  {object}  response.ErrorResponseData
// @Failure      404  {object}  response.ErrorResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /product/{id} [delete]
func (c *productController) DeleteProduct(ctx *gin.Context) {
	var req product.BulkUpdateRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	var params []database.UpdateProductParams
	for _, item := range req.Products {
		params = append(params, database.UpdateProductParams{
			ID:          int32(item.ID),
			ProductName: item.ProductName,
			ProductPrice: item.ProductPrice,
		})
	}

	products, err := service.Product.BulkUpdateProducts(ctx, params)
	if err != nil {
		response.ErrorResponse(ctx, response.ErrCodeInternalServerError, err.Error())
		return
	}

	response.SuccessResponse(ctx, response.ErrCodeSuccess, products)
}

// SearchProducts searches for products by query
// @Summary      Search products
// @Description  Search for products by a text query
// @Tags         product management
// @Accept       json
// @Produce      json
// @Param        query query string true "Search query" minlength(1) example:"tomato"
// @Param        limit query int true "Number of items to return" minimum(1) maximum(100) example:10
// @Param        offset query int false "Number of items to skip" minimum(0) default(0) example:0
// @Success      200  {object}  response.ResponseData
// @Failure      400  {object}  response.ErrorResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /product/search [get]
func (c *productController) SearchProducts(ctx *gin.Context) {
	var params struct {
		Query  string `form:"query" binding:"required,min=1"`
		Limit  int32  `form:"limit" binding:"required,min=1,max=100"`
		Offset int32  `form:"offset" binding:"min=0"`
	}
	if err := ctx.ShouldBindQuery(&params); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	products, err := service.Product.SearchProducts(ctx, params.Query, params.Limit, params.Offset)
	if err != nil {
		response.ErrorResponse(ctx, response.ErrCodeInternalServerError, err.Error())
		return
	}

	response.SuccessResponse(ctx, response.ErrCodeSuccess, products)
}

// FilterProducts handles filtering products by various criteria
// @Summary      Filter products
// @Description  Filter products by category, price range, stock status, and other criteria
// @Tags         product management
// @Accept       json
// @Produce      json
// @Param        category query string false "Product category" example:"vegetable"
// @Param        minPrice query number false "Minimum price" example:10.00
// @Param        maxPrice query number false "Maximum price" example:50.00
// @Param        inStock query boolean false "In stock status" example:true
// @Param        sortBy query string false "Sort field" Enums(price, name, created_at) example:"price"
// @Param        sortOrder query string false "Sort direction" Enums(asc, desc) example:"asc"
// @Param        limit query int true "Number of items to return" minimum(1) maximum(100) example:10
// @Param        offset query int false "Number of items to skip" minimum(0) default(0) example:0
// @Success      200  {object}  response.ResponseData
// @Failure      400  {object}  response.ErrorResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /product/filter [get]
func (c *productController) FilterProducts(ctx *gin.Context) {
	var params struct {
		Category    *string  `form:"category"`
		MinPrice    *float64 `form:"minPrice"`
		MaxPrice    *float64 `form:"maxPrice"`
		InStock     *bool    `form:"inStock"`
		SortBy      string   `form:"sortBy" binding:"omitempty,oneof=price name created_at"`
		SortOrder   string   `form:"sortOrder" binding:"omitempty,oneof=asc desc"`
		Limit       int32    `form:"limit" binding:"required,min=1,max=100"`
		Offset      int32    `form:"offset" binding:"min=0"`
	}
	if err := ctx.ShouldBindQuery(&params); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	// Convert parameters to database types
	dbParams := database.FilterProductsParams{
		Limit:  params.Limit,
		Offset: params.Offset,
	}

	if params.Category != nil {
		dbParams.Category = sql.NullString{
			String: *params.Category,
			Valid:  true,
		}
	}

	if params.MinPrice != nil {
		dbParams.MinPrice = sql.NullString{
			String: fmt.Sprintf("%.2f", *params.MinPrice),
			Valid:  true,
		}
	}

	if params.MaxPrice != nil {
		dbParams.MaxPrice = sql.NullString{
			String: fmt.Sprintf("%.2f", *params.MaxPrice),
			Valid:  true,
		}
	}

	if params.InStock != nil {
		dbParams.InStock = sql.NullBool{
			Bool:  *params.InStock,
			Valid: true,
		}
	}

	if params.SortBy != "" {
		dbParams.SortBy = sql.NullString{
			String: params.SortBy,
			Valid:  true,
		}
	}

	if params.SortOrder != "" {
		dbParams.SortOrder = sql.NullString{
			String: params.SortOrder,
			Valid:  true,
		}
	}

	products, err := service.Product.FilterProducts(ctx, dbParams)
	if err != nil {
		response.ErrorResponse(ctx, response.ErrCodeInternalServerError, err.Error())
		return
	}

	response.SuccessResponse(ctx, response.ErrCodeSuccess, products)
}

// GetProductStats returns statistics about products
// @Summary      Get product statistics
// @Description  Get aggregated statistics about products including counts, price ranges, and ratings
// @Tags         product management
// @Accept       json
// @Produce      json
// @Success      200  {object}  response.ResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /product/stats [get]
func (c *productController) GetProductStats(ctx *gin.Context) {
	stats, err := service.Product.GetProductStats(ctx)
	if err != nil {
		response.ErrorResponse(ctx, response.ErrCodeInternalServerError, err.Error())
		return
	}

	response.SuccessResponse(ctx, response.ErrCodeSuccess, stats)
}

// BulkUpdateProducts handles updating multiple products at once
// @Summary      Bulk update products
// @Description  Update multiple products in a single request
// @Tags         product management
// @Accept       json
// @Produce      json
// @Param        payload body product.BulkUpdateRequest true "Products to update"
// @Success      200  {object}  response.ResponseData
// @Failure      400  {object}  response.ErrorResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /product/bulk-update [put]
func (c *productController) BulkUpdateProducts(ctx *gin.Context) {
	var params struct {
		Products []database.UpdateProductParams `json:"products" binding:"required,min=1,max=100"`
	}
	if err := ctx.ShouldBindJSON(&params); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	results, err := service.Product.BulkUpdateProducts(ctx, params.Products)
	if err != nil {
		response.ErrorResponse(ctx, response.ErrCodeInternalServerError, err.Error())
		return
	}

	response.SuccessResponse(ctx, response.ErrCodeSuccess, results)
}

// Các controller cho Mushroom, Vegetable, và Bonsai đã được loại bỏ
// vì chúng nên được xử lý như các product_type thông qua ProductTypeController