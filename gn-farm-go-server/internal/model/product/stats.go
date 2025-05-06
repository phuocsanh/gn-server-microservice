package product

// ProductStats định nghĩa cấu trúc cho thống kê sản phẩm
type ProductStats struct {
	TotalProducts      int64       `json:"total_products"`
	InStockProducts    int64       `json:"in_stock_products"`
	OutOfStockProducts int64       `json:"out_of_stock_products"`
	TotalProductsSold  int64       `json:"total_products_sold"`
	AverageRating      float64     `json:"average_rating"`
	MinPrice           interface{} `json:"min_price"` // Sử dụng interface{} hoặc kiểu cụ thể như *string hoặc *float64 tùy thuộc vào kết quả DB
	MaxPrice           interface{} `json:"max_price"` // Sử dụng interface{} hoặc kiểu cụ thể như *string hoặc *float64 tùy thuộc vào kết quả DB
	AvgPrice           float64     `json:"avg_price"`
	TotalCategories    int64       `json:"total_categories"`
}
