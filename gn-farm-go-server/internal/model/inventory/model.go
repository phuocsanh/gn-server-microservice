package inventory

import (
	"time"
)

// InventoryReceipt chứa thông tin phiếu nhập kho
type InventoryReceipt struct {
	ID               int32     `json:"id"`
	ReceiptCode      string    `json:"receipt_code"`
	SupplierName     *string   `json:"supplier_name"`
	SupplierContact  *string   `json:"supplier_contact"`
	CreatedByUserID  int32     `json:"created_by_user_id"`
	CheckedByUserID  *int32    `json:"checked_by_user_id"`
	TotalAmount      string    `json:"total_amount"`
	TotalItems       int32     `json:"total_items"`
	Notes            *string   `json:"notes"`
	Status           int32     `json:"status"` // 1: Chờ xử lý, 2: Đã kiểm tra, 3: Đã nhập kho, 4: Hủy
	ReceiptDate      time.Time `json:"receipt_date"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// InventoryReceiptItem chứa chi tiết sản phẩm trong phiếu nhập
type InventoryReceiptItem struct {
	ID          int32      `json:"id"`
	ReceiptID   int32      `json:"receipt_id"`
	ProductID   int32      `json:"product_id"`
	Quantity    int32      `json:"quantity"`
	UnitPrice   string     `json:"unit_price"`
	TotalPrice  string     `json:"total_price"`
	ExpiryDate  *time.Time `json:"expiry_date"`
	BatchNumber *string    `json:"batch_number"`
	Notes       *string    `json:"notes"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// InventoryHistory chứa lịch sử thay đổi tồn kho
type InventoryHistory struct {
	ID               int32     `json:"id"`
	ProductID        int32     `json:"product_id"`
	ReceiptItemID    *int32    `json:"receipt_item_id"`
	ChangeType       string    `json:"change_type"` // 'IN', 'OUT', 'ADJUST'
	QuantityBefore   int32     `json:"quantity_before"`
	QuantityChange   int32     `json:"quantity_change"`
	QuantityAfter    int32     `json:"quantity_after"`
	UnitPrice        *string   `json:"unit_price"`
	Reason           *string   `json:"reason"`
	CreatedByUserID  int32     `json:"created_by_user_id"`
	CreatedAt        time.Time `json:"created_at"`
}

// InventoryReceiptStatus constants
const (
	StatusPending   = 1 // Chờ xử lý
	StatusChecked   = 2 // Đã kiểm tra
	StatusCompleted = 3 // Đã nhập kho
	StatusCancelled = 4 // Hủy
)

// InventoryChangeType constants
const (
	ChangeTypeIn     = "IN"     // Nhập kho
	ChangeTypeOut    = "OUT"    // Xuất kho
	ChangeTypeAdjust = "ADJUST" // Điều chỉnh
)
