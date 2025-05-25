package product

import (
	"fmt"
	"gn-farm-go-server/internal/model"
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

	// Call service following user pattern
	codeRs, dataRs, err := service.Product.CreateProduct(ctx, &req)
	if err != nil {
		response.ErrorResponse(ctx, codeRs, err.Error())
		return
	}

	response.SuccessResponse(ctx, codeRs, dataRs)
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
	var params struct {
		ID int32 `uri:"id" binding:"required,min=1"`
	}
	if err := ctx.ShouldBindUri(&params); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	// Call service following user pattern
	codeRs, dataRs, err := service.Product.GetProduct(ctx, params.ID)
	if err != nil {
		response.ErrorResponse(ctx, codeRs, err.Error())
		return
	}

	response.SuccessResponse(ctx, codeRs, dataRs)
}

// ListProducts retrieves a list of products
// @Summary      List products
// @Description  Get a paginated list of products with optional filtering by type and subtype. If limit is not provided, returns all products.
// @Tags         product management
// @Accept       json
// @Produce      json
// @Param        limit query int false "Number of items to return (0 or omit for all)" minimum(0) maximum(1000) example:10
// @Param        offset query int false "Number of items to skip" minimum(0) default(0) example:0
// @Param        type query int false "Product type ID to filter by" example:1
// @Param        subType query int false "Product subtype ID to filter by" example:1
// @Success      200  {object}  response.ResponseData
// @Failure      400  {object}  response.ErrorResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /product [get]
func (c *productController) ListProducts(ctx *gin.Context) {
	var params struct {
		Limit   *int32 `form:"limit" binding:"omitempty,min=0,max=1000"`
		Offset  int32  `form:"offset" binding:"min=0"`
		Type    *int32 `form:"type"`
		SubType *int32 `form:"subType"`
	}
	if err := ctx.ShouldBindQuery(&params); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	// Set default limit if not provided (0 means get all)
	var limit interface{} = int32(0)
	if params.Limit != nil {
		limit = *params.Limit
	}

	// Create pagination request
	limitInt32 := limit.(int32)
	var page int
	var pageSize int

	if limitInt32 == 0 {
		// No limit specified, use default pagination
		page = 1
		pageSize = 10 // Default page size
	} else {
		page = int(params.Offset/limitInt32) + 1
		pageSize = int(limitInt32)
	}

	paginationRequest := &model.PaginationRequest{
		Page:     page,
		PageSize: pageSize,
		Search:   "", // No search in this endpoint
	}

	// Check if filtering is needed
	if params.Type != nil || params.SubType != nil {
		// Call service with filter following user pattern
		codeRs, dataRs, err := service.Product.ListProductsWithFilter(ctx, params.Type, params.SubType, paginationRequest)
		if err != nil {
			response.ErrorResponse(ctx, codeRs, err.Error())
			return
		}

		response.SuccessResponse(ctx, codeRs, dataRs)
	} else {
		// Call service without filter following user pattern
		codeRs, dataRs, err := service.Product.ListProducts(ctx, paginationRequest)
		if err != nil {
			response.ErrorResponse(ctx, codeRs, err.Error())
			return
		}

		response.SuccessResponse(ctx, codeRs, dataRs)
	}
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

	var params struct {
		ID int32 `uri:"id" binding:"required"`
	}
	if err := ctx.ShouldBindUri(&params); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	// Call service following user pattern
	codeRs, dataRs, err := service.Product.UpdateProduct(ctx, params.ID, &req)
	if err != nil {
		response.ErrorResponse(ctx, codeRs, err.Error())
		return
	}

	response.SuccessResponse(ctx, codeRs, dataRs)
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
	var id int32
	if err := ctx.ShouldBindUri(&id); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	// Call service following user pattern
	codeRs, err := service.Product.DeleteProduct(ctx, id)
	if err != nil {
		response.ErrorResponse(ctx, codeRs, err.Error())
		return
	}

	response.SuccessResponse(ctx, codeRs, gin.H{"message": "Product deleted successfully"})
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

	// Call service following user pattern
	codeRs, dataRs, err := service.Product.SearchProducts(ctx, params.Query, params.Limit, params.Offset)
	if err != nil {
		response.ErrorResponse(ctx, codeRs, err.Error())
		return
	}

	response.SuccessResponse(ctx, codeRs, dataRs)
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

	// Convert to VO request
	filterReq := &product.FilterProductsRequest{
		Category:  params.Category,
		MinPrice:  params.MinPrice,
		MaxPrice:  params.MaxPrice,
		InStock:   params.InStock,
		SortBy:    params.SortBy,
		SortOrder: params.SortOrder,
		Limit:     params.Limit,
		Offset:    params.Offset,
	}

	// Call service following user pattern
	codeRs, dataRs, err := service.Product.FilterProducts(ctx, filterReq)
	if err != nil {
		response.ErrorResponse(ctx, codeRs, err.Error())
		return
	}

	response.SuccessResponse(ctx, codeRs, dataRs)
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
	// Call service following user pattern
	codeRs, dataRs, err := service.Product.GetProductStats(ctx)
	if err != nil {
		response.ErrorResponse(ctx, codeRs, err.Error())
		return
	}

	response.SuccessResponse(ctx, codeRs, dataRs)
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
	var req product.BulkUpdateRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	// Convert to VO request
	var updateRequests []product.UpdateProductRequest
	for _, item := range req.Products {
		updateRequests = append(updateRequests, product.UpdateProductRequest{
			ProductName:  item.ProductName,
			ProductPrice: item.ProductPrice,
			// Add other fields as needed
		})
	}

	// Call service following user pattern
	codeRs, dataRs, err := service.Product.BulkUpdateProducts(ctx, updateRequests)
	if err != nil {
		response.ErrorResponse(ctx, codeRs, err.Error())
		return
	}

	response.SuccessResponse(ctx, codeRs, dataRs)
}

// Các controller cho Mushroom, Vegetable, và Bonsai đã được loại bỏ
// vì chúng nên được xử lý như các product_type thông qua ProductTypeController