package product

import (
	"database/sql"
	"fmt"
	"gn-farm-go-server/internal/database"
	"gn-farm-go-server/internal/service"
	"gn-farm-go-server/pkg/response"

	"github.com/gin-gonic/gin"
)

// ProductRequest represents a request to create a product
// @Description Product creation request
type ProductRequest struct {
	ProductName        string `json:"product_name" example:"Organic Tomato"`
	ProductPrice       string `json:"product_price" example:"15.99"`
	ProductThumb       string `json:"product_thumb" example:"https://example.com/tomato.jpg"`
	ProductDescription string `json:"product_description" example:"Fresh organic tomatoes"`
	ProductQuantity    int    `json:"product_quantity" example:"100"`
	ProductType        string `json:"product_type" example:"vegetable"`
}

// ProductUpdateRequest represents a request to update a product
// @Description Product update request
type ProductUpdateRequest struct {
	ProductName        string `json:"product_name" example:"Organic Tomato Premium"`
	ProductPrice       string `json:"product_price" example:"19.99"`
	ProductThumb       string `json:"product_thumb" example:"https://example.com/tomato-premium.jpg"`
	ProductDescription string `json:"product_description" example:"Premium organic tomatoes"`
	ProductQuantity    int    `json:"product_quantity" example:"50"`
}

// BulkUpdateRequest represents a request to update multiple products
// @Description Bulk product update request
type BulkUpdateRequest struct {
	Products []ProductUpdateItem `json:"products"`
}

// ProductUpdateItem represents a single product update in a bulk update
// @Description Product update item
type ProductUpdateItem struct {
	ID          int    `json:"id" example:"1"`
	ProductName string `json:"product_name" example:"Updated Product 1"`
	ProductPrice string `json:"product_price" example:"29.99"`
}

// MushroomRequest represents a request to create a mushroom
// @Description Mushroom creation request
type MushroomRequest struct {
	MushroomName        string `json:"mushroom_name" example:"Shiitake Mushroom"`
	MushroomType        string `json:"mushroom_type" example:"Edible"`
	MushroomDescription string `json:"mushroom_description" example:"Popular culinary mushroom"`
	MushroomPrice       string `json:"mushroom_price" example:"12.99"`
	MushroomQuantity    int    `json:"mushroom_quantity" example:"50"`
}

// MushroomUpdateRequest represents a request to update a mushroom
// @Description Mushroom update request
type MushroomUpdateRequest struct {
	MushroomName        string `json:"mushroom_name" example:"Premium Shiitake"`
	MushroomDescription string `json:"mushroom_description" example:"Premium quality shiitake mushrooms"`
	MushroomPrice       string `json:"mushroom_price" example:"15.99"`
}

// VegetableRequest represents a request to create a vegetable
// @Description Vegetable creation request
type VegetableRequest struct {
	VegetableName        string `json:"vegetable_name" example:"Organic Spinach"`
	VegetableType        string `json:"vegetable_type" example:"Leafy Green"`
	VegetableDescription string `json:"vegetable_description" example:"Fresh organic spinach"`
	VegetablePrice       string `json:"vegetable_price" example:"8.99"`
	VegetableQuantity    int    `json:"vegetable_quantity" example:"100"`
}

// VegetableUpdateRequest represents a request to update a vegetable
// @Description Vegetable update request
type VegetableUpdateRequest struct {
	VegetableName        string `json:"vegetable_name" example:"Premium Spinach"`
	VegetableDescription string `json:"vegetable_description" example:"Premium quality organic spinach"`
	VegetablePrice       string `json:"vegetable_price" example:"10.99"`
}

// BonsaiRequest represents a request to create a bonsai
// @Description Bonsai creation request
type BonsaiRequest struct {
	BonsaiName        string `json:"bonsai_name" example:"Japanese Maple Bonsai"`
	BonsaiType        string `json:"bonsai_type" example:"Deciduous"`
	BonsaiDescription string `json:"bonsai_description" example:"Beautiful Japanese maple bonsai tree"`
	BonsaiPrice       string `json:"bonsai_price" example:"89.99"`
	BonsaiAge         int    `json:"bonsai_age" example:"5"`
	BonsaiHeight      int    `json:"bonsai_height" example:"25"`
}

// BonsaiUpdateRequest represents a request to update a bonsai
// @Description Bonsai update request
type BonsaiUpdateRequest struct {
	BonsaiName        string `json:"bonsai_name" example:"Premium Japanese Maple"`
	BonsaiDescription string `json:"bonsai_description" example:"Premium quality Japanese maple bonsai"`
	BonsaiPrice       string `json:"bonsai_price" example:"99.99"`
}

var (
	Product   = new(productController)
	Mushroom  = new(mushroomController)
	Vegetable = new(vegetableController)
	Bonsai    = new(bonsaiController)
)

type productController struct{}

// CreateProduct creates a new product
// @Summary      Create a new product
// @Description  Create a new product with the provided details
// @Tags         product management
// @Accept       json
// @Produce      json
// @Param        payload body ProductRequest true "Product details"
// @Success      200  {object}  response.ResponseData
// @Failure      400  {object}  response.ErrorResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /product [post]
func (c *productController) CreateProduct(ctx *gin.Context) {
	var params database.CreateProductParams
	if err := ctx.ShouldBindJSON(&params); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
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
		Limit  int32 `form:"limit" binding:"required,min=1,max=100"`
		Offset int32 `form:"offset" binding:"min=0"`
	}
	if err := ctx.ShouldBindQuery(&params); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	products, err := service.Product.ListProducts(ctx, params.Limit, params.Offset)
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
// @Param        payload body ProductUpdateRequest true "Updated product details"
// @Success      200  {object}  response.ResponseData
// @Failure      400  {object}  response.ErrorResponseData
// @Failure      404  {object}  response.ErrorResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /product/{id} [put]
func (c *productController) UpdateProduct(ctx *gin.Context) {
	var params database.UpdateProductParams
	if err := ctx.ShouldBindJSON(&params); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	var id int32
	if err := ctx.ShouldBindUri(&id); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}
	params.ID = id

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
	var id int32
	if err := ctx.ShouldBindUri(&id); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	if err := service.Product.DeleteProduct(ctx, id); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeInternalServerError, err.Error())
		return
	}

	response.SuccessResponse(ctx, response.ErrCodeSuccess, nil)
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
// @Param        min_price query number false "Minimum price" example:10.00
// @Param        max_price query number false "Maximum price" example:50.00
// @Param        in_stock query boolean false "In stock status" example:true
// @Param        sort_by query string false "Sort field" Enums(price, name, created_at) example:"price"
// @Param        sort_order query string false "Sort direction" Enums(asc, desc) example:"asc"
// @Param        limit query int true "Number of items to return" minimum(1) maximum(100) example:10
// @Param        offset query int false "Number of items to skip" minimum(0) default(0) example:0
// @Success      200  {object}  response.ResponseData
// @Failure      400  {object}  response.ErrorResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /product/filter [get]
func (c *productController) FilterProducts(ctx *gin.Context) {
	var params struct {
		Category    *string  `form:"category"`
		MinPrice    *float64 `form:"min_price"`
		MaxPrice    *float64 `form:"max_price"`
		InStock     *bool    `form:"in_stock"`
		SortBy      string   `form:"sort_by" binding:"omitempty,oneof=price name created_at"`
		SortOrder   string   `form:"sort_order" binding:"omitempty,oneof=asc desc"`
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
// @Param        payload body BulkUpdateRequest true "Products to update"
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

type mushroomController struct{}

// CreateMushroom creates a new mushroom product
// @Summary      Create a new mushroom
// @Description  Create a new mushroom product with the provided details
// @Tags         mushroom management
// @Accept       json
// @Produce      json
// @Param        payload body MushroomRequest true "Mushroom details"
// @Success      200  {object}  response.ResponseData
// @Failure      400  {object}  response.ErrorResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /product/mushroom [post]
func (c *mushroomController) CreateMushroom(ctx *gin.Context) {
	var params database.CreateMushroomParams
	if err := ctx.ShouldBindJSON(&params); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	mushroom, err := service.Mushroom.CreateMushroom(ctx, &params)
	if err != nil {
		response.ErrorResponse(ctx, response.ErrCodeInternalServerError, err.Error())
		return
	}

	response.SuccessResponse(ctx, response.ErrCodeSuccess, mushroom)
}

// GetMushroom retrieves a mushroom by ID
// @Summary      Get a mushroom by ID
// @Description  Get detailed information about a mushroom by its ID
// @Tags         mushroom management
// @Accept       json
// @Produce      json
// @Param        id path int true "Mushroom ID" example:1
// @Success      200  {object}  response.ResponseData
// @Failure      400  {object}  response.ErrorResponseData
// @Failure      404  {object}  response.ErrorResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /product/mushroom/{id} [get]
func (c *mushroomController) GetMushroom(ctx *gin.Context) {
	var id int32
	if err := ctx.ShouldBindUri(&id); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	mushroom, err := service.Mushroom.GetMushroom(ctx, id)
	if err != nil {
		response.ErrorResponse(ctx, response.ErrCodeInternalServerError, err.Error())
		return
	}

	response.SuccessResponse(ctx, response.ErrCodeSuccess, mushroom)
}

// UpdateMushroom updates an existing mushroom
// @Summary      Update a mushroom
// @Description  Update an existing mushroom with the provided details
// @Tags         mushroom management
// @Accept       json
// @Produce      json
// @Param        id path int true "Mushroom ID" example:1
// @Param        payload body MushroomUpdateRequest true "Updated mushroom details"
// @Success      200  {object}  response.ResponseData
// @Failure      400  {object}  response.ErrorResponseData
// @Failure      404  {object}  response.ErrorResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /product/mushroom/{id} [put]
func (c *mushroomController) UpdateMushroom(ctx *gin.Context) {
	var params database.UpdateMushroomParams
	if err := ctx.ShouldBindJSON(&params); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	var id int32
	if err := ctx.ShouldBindUri(&id); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}
	params.ID = id

	mushroom, err := service.Mushroom.UpdateMushroom(ctx, &params)
	if err != nil {
		response.ErrorResponse(ctx, response.ErrCodeInternalServerError, err.Error())
		return
	}

	response.SuccessResponse(ctx, response.ErrCodeSuccess, mushroom)
}

// DeleteMushroom deletes a mushroom
// @Summary      Delete a mushroom
// @Description  Delete a mushroom by its ID
// @Tags         mushroom management
// @Accept       json
// @Produce      json
// @Param        id path int true "Mushroom ID" example:1
// @Success      200  {object}  response.ResponseData
// @Failure      400  {object}  response.ErrorResponseData
// @Failure      404  {object}  response.ErrorResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /product/mushroom/{id} [delete]
func (c *mushroomController) DeleteMushroom(ctx *gin.Context) {
	var id int32
	if err := ctx.ShouldBindUri(&id); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	if err := service.Mushroom.DeleteMushroom(ctx, id); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeInternalServerError, err.Error())
		return
	}

	response.SuccessResponse(ctx, response.ErrCodeSuccess, nil)
}

type vegetableController struct{}

// CreateVegetable creates a new vegetable product
// @Summary      Create a new vegetable
// @Description  Create a new vegetable product with the provided details
// @Tags         vegetable management
// @Accept       json
// @Produce      json
// @Param        payload body VegetableRequest true "Vegetable details"
// @Success      200  {object}  response.ResponseData
// @Failure      400  {object}  response.ErrorResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /product/vegetable [post]
func (c *vegetableController) CreateVegetable(ctx *gin.Context) {
	var params database.CreateVegetableParams
	if err := ctx.ShouldBindJSON(&params); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	vegetable, err := service.Vegetable.CreateVegetable(ctx, &params)
	if err != nil {
		response.ErrorResponse(ctx, response.ErrCodeInternalServerError, err.Error())
		return
	}

	response.SuccessResponse(ctx, response.ErrCodeSuccess, vegetable)
}

// GetVegetable retrieves a vegetable by ID
// @Summary      Get a vegetable by ID
// @Description  Get detailed information about a vegetable by its ID
// @Tags         vegetable management
// @Accept       json
// @Produce      json
// @Param        id path int true "Vegetable ID" example:1
// @Success      200  {object}  response.ResponseData
// @Failure      400  {object}  response.ErrorResponseData
// @Failure      404  {object}  response.ErrorResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /product/vegetable/{id} [get]
func (c *vegetableController) GetVegetable(ctx *gin.Context) {
	var id int32
	if err := ctx.ShouldBindUri(&id); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	vegetable, err := service.Vegetable.GetVegetable(ctx, id)
	if err != nil {
		response.ErrorResponse(ctx, response.ErrCodeInternalServerError, err.Error())
		return
	}

	response.SuccessResponse(ctx, response.ErrCodeSuccess, vegetable)
}

// UpdateVegetable updates an existing vegetable
// @Summary      Update a vegetable
// @Description  Update an existing vegetable with the provided details
// @Tags         vegetable management
// @Accept       json
// @Produce      json
// @Param        id path int true "Vegetable ID" example:1
// @Param        payload body VegetableUpdateRequest true "Updated vegetable details"
// @Success      200  {object}  response.ResponseData
// @Failure      400  {object}  response.ErrorResponseData
// @Failure      404  {object}  response.ErrorResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /product/vegetable/{id} [put]
func (c *vegetableController) UpdateVegetable(ctx *gin.Context) {
	var params database.UpdateVegetableParams
	if err := ctx.ShouldBindJSON(&params); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	var id int32
	if err := ctx.ShouldBindUri(&id); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}
	params.ID = id

	vegetable, err := service.Vegetable.UpdateVegetable(ctx, &params)
	if err != nil {
		response.ErrorResponse(ctx, response.ErrCodeInternalServerError, err.Error())
		return
	}

	response.SuccessResponse(ctx, response.ErrCodeSuccess, vegetable)
}

// DeleteVegetable deletes a vegetable
// @Summary      Delete a vegetable
// @Description  Delete a vegetable by its ID
// @Tags         vegetable management
// @Accept       json
// @Produce      json
// @Param        id path int true "Vegetable ID" example:1
// @Success      200  {object}  response.ResponseData
// @Failure      400  {object}  response.ErrorResponseData
// @Failure      404  {object}  response.ErrorResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /product/vegetable/{id} [delete]
func (c *vegetableController) DeleteVegetable(ctx *gin.Context) {
	var id int32
	if err := ctx.ShouldBindUri(&id); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	if err := service.Vegetable.DeleteVegetable(ctx, id); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeInternalServerError, err.Error())
		return
	}

	response.SuccessResponse(ctx, response.ErrCodeSuccess, nil)
}

type bonsaiController struct{}

// CreateBonsai creates a new bonsai product
// @Summary      Create a new bonsai
// @Description  Create a new bonsai product with the provided details
// @Tags         bonsai management
// @Accept       json
// @Produce      json
// @Param        payload body BonsaiRequest true "Bonsai details"
// @Success      200  {object}  response.ResponseData
// @Failure      400  {object}  response.ErrorResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /product/bonsai [post]
func (c *bonsaiController) CreateBonsai(ctx *gin.Context) {
	var params database.CreateBonsaiParams
	if err := ctx.ShouldBindJSON(&params); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	bonsai, err := service.Bonsai.CreateBonsai(ctx, &params)
	if err != nil {
		response.ErrorResponse(ctx, response.ErrCodeInternalServerError, err.Error())
		return
	}

	response.SuccessResponse(ctx, response.ErrCodeSuccess, bonsai)
}

// GetBonsai retrieves a bonsai by ID
// @Summary      Get a bonsai by ID
// @Description  Get detailed information about a bonsai by its ID
// @Tags         bonsai management
// @Accept       json
// @Produce      json
// @Param        id path int true "Bonsai ID" example:1
// @Success      200  {object}  response.ResponseData
// @Failure      400  {object}  response.ErrorResponseData
// @Failure      404  {object}  response.ErrorResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /product/bonsai/{id} [get]
func (c *bonsaiController) GetBonsai(ctx *gin.Context) {
	var id int32
	if err := ctx.ShouldBindUri(&id); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	bonsai, err := service.Bonsai.GetBonsai(ctx, id)
	if err != nil {
		response.ErrorResponse(ctx, response.ErrCodeInternalServerError, err.Error())
		return
	}

	response.SuccessResponse(ctx, response.ErrCodeSuccess, bonsai)
}

// UpdateBonsai updates an existing bonsai
// @Summary      Update a bonsai
// @Description  Update an existing bonsai with the provided details
// @Tags         bonsai management
// @Accept       json
// @Produce      json
// @Param        id path int true "Bonsai ID" example:1
// @Param        payload body BonsaiUpdateRequest true "Updated bonsai details"
// @Success      200  {object}  response.ResponseData
// @Failure      400  {object}  response.ErrorResponseData
// @Failure      404  {object}  response.ErrorResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /product/bonsai/{id} [put]
func (c *bonsaiController) UpdateBonsai(ctx *gin.Context) {
	var params database.UpdateBonsaiParams
	if err := ctx.ShouldBindJSON(&params); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	var id int32
	if err := ctx.ShouldBindUri(&id); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}
	params.ID = id

	bonsai, err := service.Bonsai.UpdateBonsai(ctx, &params)
	if err != nil {
		response.ErrorResponse(ctx, response.ErrCodeInternalServerError, err.Error())
		return
	}

	response.SuccessResponse(ctx, response.ErrCodeSuccess, bonsai)
}

// DeleteBonsai deletes a bonsai
// @Summary      Delete a bonsai
// @Description  Delete a bonsai by its ID
// @Tags         bonsai management
// @Accept       json
// @Produce      json
// @Param        id path int true "Bonsai ID" example:1
// @Success      200  {object}  response.ResponseData
// @Failure      400  {object}  response.ErrorResponseData
// @Failure      404  {object}  response.ErrorResponseData
// @Failure      500  {object}  response.ErrorResponseData
// @Router       /product/bonsai/{id} [delete]
func (c *bonsaiController) DeleteBonsai(ctx *gin.Context) {
	var id int32
	if err := ctx.ShouldBindUri(&id); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeParamInvalid, err.Error())
		return
	}

	if err := service.Bonsai.DeleteBonsai(ctx, id); err != nil {
		response.ErrorResponse(ctx, response.ErrCodeInternalServerError, err.Error())
		return
	}

	response.SuccessResponse(ctx, response.ErrCodeSuccess, nil)
}