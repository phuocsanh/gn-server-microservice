package inventory

import (
	"time"
	"gn-farm-go-server/internal/model/inventory"
)

// InventoryReceiptResponse phản hồi thông tin phiếu nhập kho
type InventoryReceiptResponse struct {
	ID               int32                         `json:"id"`
	ReceiptCode      string                        `json:"receiptCode"`
	SupplierName     *string                       `json:"supplierName"`
	SupplierContact  *string                       `json:"supplierContact"`
	CreatedByUserID  int32                         `json:"createdByUserId"`
	CheckedByUserID  *int32                        `json:"checkedByUserId"`
	TotalAmount      string                        `json:"totalAmount"`
	TotalItems       int32                         `json:"totalItems"`
	Notes            *string                       `json:"notes"`
	Status           int32                         `json:"status"`
	StatusText       string                        `json:"statusText"`
	ReceiptDate      time.Time                     `json:"receiptDate"`
	CreatedAt        time.Time                     `json:"createdAt"`
	UpdatedAt        time.Time                     `json:"updatedAt"`
	Items            []InventoryReceiptItemResponse `json:"items,omitempty"`
}

// InventoryReceiptItemResponse phản hồi chi tiết sản phẩm trong phiếu nhập
type InventoryReceiptItemResponse struct {
	ID          int32      `json:"id"`
	ReceiptID   int32      `json:"receiptId"`
	ProductID   int32      `json:"productId"`
	ProductName *string    `json:"productName,omitempty"`
	Quantity    int32      `json:"quantity"`
	UnitPrice   string     `json:"unitPrice"`
	TotalPrice  string     `json:"totalPrice"`
	ExpiryDate  *time.Time `json:"expiryDate"`
	BatchNumber *string    `json:"batchNumber"`
	Notes       *string    `json:"notes"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// InventoryHistoryResponse phản hồi lịch sử tồn kho
type InventoryHistoryResponse struct {
	ID               int32     `json:"id"`
	ProductID        int32     `json:"productId"`
	ProductName      *string   `json:"productName,omitempty"`
	ReceiptItemID    *int32    `json:"receiptItemId"`
	ChangeType       string    `json:"changeType"`
	ChangeTypeText   string    `json:"changeTypeText"`
	QuantityBefore   int32     `json:"quantityBefore"`
	QuantityChange   int32     `json:"quantityChange"`
	QuantityAfter    int32     `json:"quantityAfter"`
	UnitPrice        *string   `json:"unitPrice"`
	Reason           *string   `json:"reason"`
	CreatedByUserID  int32     `json:"createdByUserId"`
	CreatedAt        time.Time `json:"createdAt"`
}

// ListInventoryReceiptsResponse phản hồi danh sách phiếu nhập kho
type ListInventoryReceiptsResponse struct {
	Data       []InventoryReceiptResponse `json:"data"`
	Total      int64                      `json:"total"`
	Page       int32                      `json:"page"`
	Limit      int32                      `json:"limit"`
	TotalPages int32                      `json:"totalPages"`
}

// ListInventoryHistoryResponse phản hồi danh sách lịch sử tồn kho
type ListInventoryHistoryResponse struct {
	Data       []InventoryHistoryResponse `json:"data"`
	Total      int64                      `json:"total"`
	Page       int32                      `json:"page"`
	Limit      int32                      `json:"limit"`
	TotalPages int32                      `json:"totalPages"`
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
