package product

import (
	"encoding/json"
	"time"

	"github.com/guregu/null"
)

// ProductResponse định nghĩa cấu trúc response cho product (sử dụng guregu/null)
type ProductResponse struct {
	ID                     int32           `json:"id"`
	ProductName            string          `json:"product_name"`
	ProductPrice           string          `json:"product_price"`
	ProductStatus          null.Int        `json:"product_status"`
	ProductThumb           string          `json:"product_thumb"`
	ProductPictures        []string        `json:"product_pictures"`
	ProductVideos          []string        `json:"product_videos"`
	ProductRatingsAverage  null.String     `json:"product_ratings_average"`
	ProductVariations      json.RawMessage `json:"product_variations"`
	ProductDescription     null.String     `json:"product_description"`
	ProductSlug            null.String     `json:"product_slug"`
	ProductQuantity        null.Int        `json:"product_quantity"`
	ProductType            int32           `json:"product_type"`
	SubProductType         []int32         `json:"sub_product_type"`
	Discount               null.String     `json:"discount"`
	ProductDiscountedPrice string          `json:"product_discounted_price"`
	ProductSelled          null.Int        `json:"product_selled"`
	ProductAttributes      json.RawMessage `json:"product_attributes"`
	IsDraft                null.Bool       `json:"is_draft"`
	IsPublished            null.Bool       `json:"is_published"`
	CreatedAt              time.Time       `json:"created_at"`
	UpdatedAt              time.Time       `json:"updated_at"`
}



// ProductTypeResponse định nghĩa cấu trúc cho response loại sản phẩm
type ProductTypeResponse struct {
	ID          int32       `json:"id"`
	Name        string      `json:"name"`
	Description null.String `json:"description"`
	ImageURL    null.String `json:"image_url"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}

// ProductSubTypeResponse định nghĩa cấu trúc cho response subtype sản phẩm
type ProductSubTypeResponse struct {
	ID          int32       `json:"id"`
	Name        string      `json:"name"`
	Description null.String `json:"description"`
	ProductType int32       `json:"product_type"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}

// ProductStats định nghĩa cấu trúc cho thống kê sản phẩm
type ProductStats struct {
	TotalProducts     int64   `json:"total_products"`
	InStockProducts   int64   `json:"in_stock_products"`
	OutOfStockProducts int64  `json:"out_of_stock_products"`
	TotalProductsSold int64   `json:"total_products_sold"`
	AverageRating     float64 `json:"average_rating"`
	MinPrice          string  `json:"min_price"`
	MaxPrice          string  `json:"max_price"`
	AvgPrice          string  `json:"avg_price"`
	TotalCategories   int64   `json:"total_categories"`
}


