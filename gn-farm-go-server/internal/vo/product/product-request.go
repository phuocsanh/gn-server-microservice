package product

import "encoding/json"

// CreateProductRequest represents a request to create a product with all fields
type CreateProductRequest struct {
	ProductName            string          `json:"productName" example:"Organic Tomato"`
	ProductPrice           string          `json:"productPrice" example:"15.99"`
	ProductStatus          *int32          `json:"productStatus,omitempty" example:"1"`
	ProductThumb           string          `json:"productThumb" example:"https://example.com/tomato.jpg"`
	ProductPictures        []string        `json:"productPictures"`
	ProductVideos          []string        `json:"productVideos"`
	ProductDescription     *string         `json:"productDescription,omitempty" example:"Fresh organic tomatoes"`
	ProductQuantity        *int32          `json:"productQuantity,omitempty" example:"100"`
	ProductType            int32           `json:"productType" example:"1"`
	SubProductType         []int32         `json:"subProductType" example:"[1,2]"`
	Discount               *string         `json:"discount,omitempty" example:"10"`
	ProductDiscountedPrice string          `json:"productDiscountedPrice" example:"14.39"`
	ProductAttributes      json.RawMessage `json:"productAttributes"`
	IsDraft                bool            `json:"isDraft" example:"false"`
	IsPublished            bool            `json:"isPublished" example:"true"`
}

// UpdateProductRequest represents a request to update a product with all fields
type UpdateProductRequest struct {
	ProductName            string          `json:"productName" example:"Organic Tomato Premium"`
	ProductPrice           string          `json:"productPrice" example:"19.99"`
	ProductStatus          *int32          `json:"productStatus,omitempty" example:"1"`
	ProductThumb           string          `json:"productThumb" example:"https://example.com/tomato-premium.jpg"`
	ProductPictures        []string        `json:"productPictures"`
	ProductVideos          []string        `json:"productVideos"`
	ProductDescription     *string         `json:"productDescription,omitempty" example:"Premium organic tomatoes"`
	ProductQuantity        *int32          `json:"productQuantity,omitempty" example:"50"`
	ProductType            int32           `json:"productType" example:"1"`
	SubProductType         []int32         `json:"subProductType" example:"[1,2]"`
	Discount               *string         `json:"discount,omitempty" example:"15"`
	ProductDiscountedPrice string          `json:"productDiscountedPrice" example:"16.99"`
	ProductAttributes      json.RawMessage `json:"productAttributes"`
	IsDraft                bool            `json:"isDraft" example:"false"`
	IsPublished            bool            `json:"isPublished" example:"true"`
}

// BulkUpdateRequest represents a request to update multiple products
type BulkUpdateRequest struct {
	Products []ProductUpdateItem `json:"products"`
}

// ProductUpdateItem represents a single product update in a bulk update
type ProductUpdateItem struct {
	ID          int    `json:"id" example:"1"`
	ProductName string `json:"productName" example:"Updated Product 1"`
	ProductPrice string `json:"productPrice" example:"29.99"`
}

// ProductSubTypeRequest định nghĩa cấu trúc cho request tạo/sửa subtype sản phẩm
type ProductSubTypeRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	ProductType int32  `json:"productType" binding:"required"`
}
