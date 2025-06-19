package product

import "encoding/json"

// CreateProductRequest represents a request to create a product with all fields
type CreateProductRequest struct {
	ProductName            string          `json:"product_name" example:"Organic Tomato"`
	ProductPrice           string          `json:"product_price" example:"15.99"`
	ProductStatus          *int32          `json:"product_status,omitempty" example:"1"`
	ProductThumb           string          `json:"product_thumb" example:"https://example.com/tomato.jpg"`
	ProductPictures        []string        `json:"product_pictures"`
	ProductVideos          []string        `json:"product_videos"`
	ProductDescription     *string         `json:"product_description,omitempty" example:"Fresh organic tomatoes"`
	ProductQuantity        *int32          `json:"product_quantity,omitempty" example:"100"`
	ProductType            int32           `json:"product_type" example:"1"`
	SubProductType         []int32         `json:"sub_product_type" example:"[1,2]"`
	Discount               *string         `json:"discount,omitempty" example:"10"`
	ProductDiscountedPrice string          `json:"product_discounted_price" example:"14.39"`
	ProductAttributes      json.RawMessage `json:"product_attributes"`
	IsDraft                bool            `json:"is_draft" example:"false"`
	IsPublished            bool            `json:"is_published" example:"true"`
}

// UpdateProductRequest represents a request to update a product with all fields
type UpdateProductRequest struct {
	ID                    *int32          `json:"id,omitempty" example:"1"` // Thêm trường ID cho BulkUpdateProducts
	ProductName            *string         `json:"product_name,omitempty" example:"Organic Tomato Premium"`
	ProductPrice           *string         `json:"product_price,omitempty" example:"19.99"`
	ProductStatus          *int32          `json:"product_status,omitempty" example:"1"`
	ProductThumb           *string         `json:"product_thumb,omitempty" example:"https://example.com/tomato-premium.jpg"`
	ProductPictures        *[]string       `json:"product_pictures,omitempty"`
	ProductVideos          *[]string       `json:"product_videos,omitempty"`
	ProductDescription     *string         `json:"product_description,omitempty" example:"Premium organic tomatoes"`
	ProductQuantity        *int32          `json:"product_quantity,omitempty" example:"50"`
	ProductType            *int32          `json:"product_type,omitempty" example:"1"`
	SubProductType         *[]int32        `json:"sub_product_type,omitempty" example:"[1,2]"`
	Discount               *string         `json:"discount,omitempty" example:"15"`
	ProductDiscountedPrice *string         `json:"product_discounted_price,omitempty" example:"16.99"`
	ProductAttributes      json.RawMessage `json:"product_attributes,omitempty"`
	IsDraft                *bool           `json:"is_draft,omitempty" example:"false"`
	IsPublished            *bool           `json:"is_published,omitempty" example:"true"`
}

// BulkUpdateRequest represents a request to update multiple products
type BulkUpdateRequest struct {
	Products []ProductUpdateItem `json:"products"`
}

// ProductUpdateItem represents a single product update in a bulk update
type ProductUpdateItem struct {
	ID           int    `json:"id" example:"1"`
	ProductName  string `json:"product_name" example:"Updated Product 1"`
	ProductPrice string `json:"product_price" example:"29.99"`
}

// ProductSubTypeRequest định nghĩa cấu trúc cho request tạo/sửa subtype sản phẩm
type ProductSubTypeRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	ProductType int32  `json:"product_type" binding:"required"`
}

// FilterProductsRequest represents a request to filter products
type FilterProductsRequest struct {
	Category  *string  `json:"category,omitempty" form:"category"`
	MinPrice  *float64 `json:"min_price,omitempty" form:"minPrice"`
	MaxPrice  *float64 `json:"max_price,omitempty" form:"maxPrice"`
	InStock   *bool    `json:"in_stock,omitempty" form:"inStock"`
	Tags      []string `json:"tags,omitempty" form:"tags"`
	SortBy    string   `json:"sort_by,omitempty" form:"sortBy" binding:"omitempty,oneof=price name created_at"`
	SortOrder string   `json:"sort_order,omitempty" form:"sortOrder" binding:"omitempty,oneof=asc desc"`
	Limit     int32    `json:"limit" form:"limit" binding:"required,min=1,max=100"`
	Offset    int32    `json:"offset" form:"offset" binding:"min=0"`
}
