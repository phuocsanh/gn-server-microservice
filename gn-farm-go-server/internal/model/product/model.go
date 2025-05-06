package product

import (
	"encoding/json"
	"time"
)

// Product chứa thông tin sản phẩm
type Product struct {
	ID          int32         `json:"id"`
	Name        string        `json:"name"`
	Price       string        `json:"price"`
	Type        int32         `json:"type"`
	Thumb       string        `json:"thumb"`
	Pictures    []string      `json:"pictures"`
	Videos      []string      `json:"videos"`
	Description string        `json:"description"`
	Quantity    int32         `json:"quantity"`
	SubTypes    []int32       `json:"subTypes"`
	Discount    string        `json:"discount"`
	Attributes  json.RawMessage `json:"attributes"`
	IsDraft     bool          `json:"isDraft"`
	IsPublished bool          `json:"isPublished"`
	CreatedAt   time.Time     `json:"createdAt"`
	UpdatedAt   time.Time     `json:"updatedAt"`
}
