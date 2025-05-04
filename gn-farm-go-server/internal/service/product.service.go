package service

import (
	"context"
	"gn-farm-go-server/internal/database"
)

// ProductStats defines the structure for product statistics
type ProductStats struct {
	TotalProducts      int64       `json:"total_products"`
	InStockProducts    int64       `json:"in_stock_products"`
	OutOfStockProducts int64       `json:"out_of_stock_products"`
	TotalProductsSold  int64       `json:"total_products_sold"`
	AverageRating      float64     `json:"average_rating"`
	MinPrice           interface{} `json:"min_price"` // Use interface{} or a specific type like *string or *float64 depending on DB return
	MaxPrice           interface{} `json:"max_price"` // Use interface{} or a specific type like *string or *float64 depending on DB return
	AvgPrice           float64     `json:"avg_price"`
	TotalCategories    int64       `json:"total_categories"`
}

type ProductService interface {
	CreateProduct(ctx context.Context, params *database.CreateProductParams) (*database.Product, error)
	GetProduct(ctx context.Context, id int32) (*database.Product, error)
	ListProducts(ctx context.Context, limit, offset int32) ([]*database.Product, error)
	UpdateProduct(ctx context.Context, params *database.UpdateProductParams) (*database.Product, error)
	DeleteProduct(ctx context.Context, id int32) error
	SearchProducts(ctx context.Context, query string, limit, offset int32) ([]*database.Product, error)
	FilterProducts(ctx context.Context, params database.FilterProductsParams) ([]*database.Product, error)
	GetProductStats(ctx context.Context) (*ProductStats, error)
	BulkUpdateProducts(ctx context.Context, params []database.UpdateProductParams) ([]*database.Product, error)
}

type MushroomService interface {
	CreateMushroom(ctx context.Context, params *database.CreateMushroomParams) (*database.Mushroom, error)
	GetMushroom(ctx context.Context, id int32) (*database.Mushroom, error)
	UpdateMushroom(ctx context.Context, params *database.UpdateMushroomParams) (*database.Mushroom, error)
	DeleteMushroom(ctx context.Context, id int32) error
}

type VegetableService interface {
	CreateVegetable(ctx context.Context, params *database.CreateVegetableParams) (*database.Vegetable, error)
	GetVegetable(ctx context.Context, id int32) (*database.Vegetable, error)
	UpdateVegetable(ctx context.Context, params *database.UpdateVegetableParams) (*database.Vegetable, error)
	DeleteVegetable(ctx context.Context, id int32) error
}

type BonsaiService interface {
	CreateBonsai(ctx context.Context, params *database.CreateBonsaiParams) (*database.Bonsai, error)
	GetBonsai(ctx context.Context, id int32) (*database.Bonsai, error)
	UpdateBonsai(ctx context.Context, params *database.UpdateBonsaiParams) (*database.Bonsai, error)
	DeleteBonsai(ctx context.Context, id int32) error
}

var (
	Product   ProductService
	Mushroom  MushroomService
	Vegetable VegetableService
	Bonsai    BonsaiService
)
