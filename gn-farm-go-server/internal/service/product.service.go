package service

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"gn-farm-go-server/internal/database"
	"gn-farm-go-server/internal/model"
	"gn-farm-go-server/internal/vo/product"
)

type IProductService interface {
	CreateProduct(ctx context.Context, in *product.CreateProductRequest) (codeResult int, out product.ProductResponse, err error)
	GetProduct(ctx context.Context, id int32) (codeResult int, out product.ProductResponse, err error)
	ListProducts(ctx context.Context, input *model.PaginationRequest) (codeResult int, out *model.PaginatedResponse[product.ProductResponse], err error)
	ListProductsWithFilter(ctx context.Context, productType *int32, subProductType *int32, input *model.PaginationRequest) (codeResult int, out *model.PaginatedResponse[product.ProductResponse], err error)
	UpdateProduct(ctx context.Context, id int32, in *product.UpdateProductRequest) (codeResult int, out product.ProductResponse, err error)
	DeleteProduct(ctx context.Context, id int32) (codeResult int, err error)
	SearchProducts(ctx context.Context, query string, limit, offset int32) (codeResult int, out []product.ProductResponse, err error)
	FilterProducts(ctx context.Context, in *product.FilterProductsRequest) (codeResult int, out []product.ProductResponse, err error)
	GetProductStats(ctx context.Context) (codeResult int, out product.ProductStats, err error)
	BulkUpdateProducts(ctx context.Context, in []product.UpdateProductRequest) (codeResult int, out []product.ProductResponse, err error)
}

// Các interface này được giữ lại để tương thích với code hiện tại
// nhưng triển khai sẽ được cập nhật để sử dụng ProductType
type MushroomService interface {
	CreateMushroom(ctx context.Context, name sql.NullString) (*database.Product, error)
	GetMushroom(ctx context.Context, id int32) (*database.Product, error)
	UpdateMushroom(ctx context.Context, params interface{}) (*database.Product, error)
	DeleteMushroom(ctx context.Context, id int32) error
}

type VegetableService interface {
	CreateVegetable(ctx context.Context, name sql.NullString) (*database.Product, error)
	GetVegetable(ctx context.Context, id int32) (*database.Product, error)
	UpdateVegetable(ctx context.Context, params interface{}) (*database.Product, error)
	DeleteVegetable(ctx context.Context, id int32) error
}

type BonsaiService interface {
	CreateBonsai(ctx context.Context, name sql.NullString) (*database.Product, error)
	GetBonsai(ctx context.Context, id int32) (*database.Product, error)
	UpdateBonsai(ctx context.Context, params interface{}) (*database.Product, error)
	DeleteBonsai(ctx context.Context, id int32) error
}

// Product type constants
const (
	ProductTypeMushroom  int32 = 1
	ProductTypeVegetable int32 = 2
	ProductTypeBonsai    int32 = 3
)

// Error variables
var (
	ErrInvalidProductType = fmt.Errorf("invalid product type")
)

// Product attributes
// @Description Product creation request with all fields
type ProductRequest struct {
	ProductName            string          `json:"productName" example:"Organic Tomato"`
	ProductPrice           string          `json:"productPrice" example:"15.99"`
	ProductStatus          int32           `json:"productStatus" example:"1"`
	ProductThumb           string          `json:"productThumb" example:"https://example.com/tomato.jpg"`
	ProductPictures        []string        `json:"productPictures"`
	ProductVideos          []string        `json:"productVideos"`
	ProductDescription     string          `json:"productDescription" example:"Fresh organic tomatoes"`
	ProductQuantity        int32           `json:"productQuantity" example:"100"`
	ProductType            int32           `json:"productType" example:"1"`
	SubProductType         []int32         `json:"subProductType" example:"[1,2]"`
	Discount               string          `json:"discount" example:"10"`
	ProductDiscountedPrice string          `json:"productDiscountedPrice" example:"14.39"`
	ProductAttributes      json.RawMessage `json:"productAttributes"`
	IsDraft                bool            `json:"isDraft" example:"false"`
	IsPublished            bool            `json:"isPublished" example:"true"`
}

// Các thuộc tính sản phẩm theo loại
type ProductAttributes interface{}

// Mushroom attributes
type MushroomAttributes struct {
	Brand    string `json:"brand"`
	Size     string `json:"size"`
	Material string `json:"material"`
}

// Vegetable attributes
type VegetableAttributes struct {
	Manufacturer string `json:"manufacturer"`
	Model        string `json:"model"`
	Color        string `json:"color"`
}

// Bonsai attributes
type BonsaiAttributes struct {
	Brand    string `json:"brand"`
	Size     string `json:"size"`
	Material string `json:"material"`
}

var (
	Product   IProductService
	Mushroom  MushroomService
	Vegetable VegetableService
	Bonsai    BonsaiService
)

func InitProductService(productService IProductService) {
	Product = productService
}

func InitMushroomService(mushroomService MushroomService) {
	Mushroom = mushroomService
}

func InitVegetableService(vegetableService VegetableService) {
	Vegetable = vegetableService
}

func InitBonsaiService(bonsaiService BonsaiService) {
	Bonsai = bonsaiService
}