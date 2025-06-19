package inventory

import (
	"time"
	"gn-farm-go-server/internal/model/inventory"
)

// InventoryReceiptResponse phản hồi thông tin phiếu nhập kho
type InventoryReceiptResponse struct {
	ID               int32                         `json:"id"`
	ReceiptCode      string                        `json:"receipt_code"`
	SupplierName     *string                       `json:"supplier_name"`
	SupplierContact  *string                       `json:"supplier_contact"`
	CreatedByUserID  int32                         `json:"created_by_user_id"`
	CheckedByUserID  *int32                        `json:"checked_by_user_id"`
	TotalAmount      string                        `json:"total_amount"`
	TotalItems       int32                         `json:"total_items"`
	Notes            *string                       `json:"notes"`
	Status           int32                         `json:"status"`
	StatusText       string                        `json:"status_text"`
	ReceiptDate      time.Time                     `json:"receipt_date"`
	CreatedAt        time.Time                     `json:"created_at"`
	UpdatedAt        time.Time                     `json:"updated_at"`
	Items            []InventoryReceiptItemResponse `json:"items,omitempty"`
}

// InventoryReceiptItemResponse phản hồi chi tiết sản phẩm trong phiếu nhập
type InventoryReceiptItemResponse struct {
	ID          int32      `json:"id"`
	ReceiptID   int32      `json:"receipt_id"`
	ProductID   int32      `json:"product_id"`
	ProductName *string    `json:"product_name,omitempty"`
	Quantity    int32      `json:"quantity"`
	UnitPrice   string     `json:"unit_price"`
	TotalPrice  string     `json:"total_price"`
	ExpiryDate  *time.Time `json:"expiry_date"`
	BatchNumber *string    `json:"batch_number"`
	Notes       *string    `json:"notes"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// InventoryHistoryResponse phản hồi lịch sử tồn kho
type InventoryHistoryResponse struct {
	ID               int32     `json:"id"`
	ProductID        int32     `json:"product_id"`
	ProductName      *string   `json:"product_name,omitempty"`
	ReceiptItemID    *int32    `json:"receipt_item_id"`
	ChangeType       string    `json:"change_type"`
	ChangeTypeText   string    `json:"change_type_text"`
	QuantityBefore   int32     `json:"quantity_before"`
	QuantityChange   int32     `json:"quantity_change"`
	QuantityAfter    int32     `json:"quantity_after"`
	UnitPrice        *string   `json:"unit_price"`
	Reason           *string   `json:"reason"`
	CreatedByUserID  int32     `json:"created_by_user_id"`
	CreatedAt        time.Time `json:"created_at"`
}

// ListInventoryReceiptsResponse phản hồi danh sách phiếu nhập kho
type ListInventoryReceiptsResponse struct {
	Data       []InventoryReceiptResponse `json:"data"`
	Total      int64                      `json:"total"`
	Page       int32                      `json:"page"`
	Limit      int32                      `json:"limit"`
	TotalPages int32                      `json:"total_pages"`
}

// ListInventoryHistoryResponse phản hồi danh sách lịch sử tồn kho
type ListInventoryHistoryResponse struct {
	Data       []InventoryHistoryResponse `json:"data"`
	Total      int64                      `json:"total"`
	Page       int32                      `json:"page"`
	Limit      int32                      `json:"limit"`
	TotalPages int32                      `json:"total_pages"`
}

// GetInventoryHistoryResponse phản hồi lịch sử tồn kho theo sản phẩm
type GetInventoryHistoryResponse struct {
	Histories []InventoryHistoryResponse `json:"histories"`
	Total     int64                      `json:"total"`
	Page      int32                      `json:"page"`
	Limit     int32                      `json:"limit"`
}

// GetStatusText trả về text mô tả trạng thái
func GetStatusText(status int32) string {
	switch status {
	case inventory.StatusPending:
		return "Chờ xử lý"
	case inventory.StatusChecked:
		return "Đã kiểm tra"
	case inventory.StatusCompleted:
		return "Đã nhập kho"
	case inventory.StatusCancelled:
		return "Hủy"
	default:
		return "Không xác định"
	}
}

// GetChangeTypeText trả về text mô tả loại thay đổi
func GetChangeTypeText(changeType string) string {
	switch changeType {
	case inventory.ChangeTypeIn:
		return "Nhập kho"
	case inventory.ChangeTypeOut:
		return "Xuất kho"
	case inventory.ChangeTypeAdjust:
		return "Điều chỉnh"
	default:
		return "Không xác định"
	}
}
