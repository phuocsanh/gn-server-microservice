package product

import (
	"time"
	"gn-farm-go-server/internal/model/product"
)

// ProductResponse định nghĩa cấu trúc cho response sản phẩm
type ProductResponse struct {
	product.Product
	CreatedTime time.Time `json:"created_time"`
	UpdatedTime time.Time `json:"updated_time"`
}

// ProductTypeResponse định nghĩa cấu trúc cho response loại sản phẩm
type ProductTypeResponse struct {
	ID          int32         `json:"id"`
	Name        string        `json:"name"`
	Description string        `json:"description"`
	CreatedAt   time.Time     `json:"createdAt"`
	UpdatedAt   time.Time     `json:"updatedAt"`
}

// ProductSubTypeResponse định nghĩa cấu trúc cho response subtype sản phẩm
type ProductSubTypeResponse struct {
	ID          int32         `json:"id"`
	Name        string        `json:"name"`
	Description string        `json:"description"`
	ProductType int32         `json:"productType"`
	CreatedAt   time.Time     `json:"createdAt"`
	UpdatedAt   time.Time     `json:"updatedAt"`
}
