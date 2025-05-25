package product

import (
	"encoding/json"
	"time"
)

// Product chứa thông tin sản phẩm
type Product struct {
	ID          int32           `json:"id"`
	Name        string          `json:"name"`
	Price       string          `json:"price"`
	Type        int32           `json:"type"`
	Thumb       string          `json:"thumb"`
	Pictures    []string        `json:"pictures"`
	Videos      []string        `json:"videos"`
	Description string          `json:"description"`
	Quantity    int32           `json:"quantity"`
	SubTypes    []int32         `json:"sub_types"`
	Discount    string          `json:"discount"`
	Attributes  json.RawMessage `json:"attributes"`
	IsDraft     bool            `json:"is_draft"`
	IsPublished bool            `json:"is_published"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}
