package inventory

import "time"

// CreateInventoryReceiptRequest yêu cầu tạo phiếu nhập kho
type CreateInventoryReceiptRequest struct {
	SupplierName    *string                        `json:"supplier_name" validate:"omitempty,max=200"`
	SupplierContact *string                        `json:"supplier_contact" validate:"omitempty,max=100"`
	CheckedByUserID *int32                         `json:"checked_by_user_id"`
	Notes           *string                        `json:"notes"`
	ReceiptDate     *time.Time                     `json:"receipt_date"`
	Items           []CreateInventoryReceiptItemRequest `json:"items" validate:"required,min=1"`
}

// CreateInventoryReceiptItemRequest yêu cầu tạo chi tiết sản phẩm trong phiếu nhập
type CreateInventoryReceiptItemRequest struct {
	ProductID   int32      `json:"product_id" validate:"required,min=1"`
	Quantity    int32      `json:"quantity" validate:"required,min=1"`
	UnitPrice   string     `json:"unit_price" validate:"required"`
	ExpiryDate  *time.Time `json:"expiry_date"`
	BatchNumber *string    `json:"batch_number" validate:"omitempty,max=100"`
	Notes       *string    `json:"notes"`
}

// UpdateInventoryReceiptRequest yêu cầu cập nhật phiếu nhập kho
type UpdateInventoryReceiptRequest struct {
	SupplierName    *string `json:"supplier_name" validate:"omitempty,max=200"`
	SupplierContact *string `json:"supplier_contact" validate:"omitempty,max=100"`
	CheckedByUserID *int32  `json:"checked_by_user_id"`
	Notes           *string `json:"notes"`
	Status          *int32  `json:"status" validate:"omitempty,min=1,max=4"`
}

// UpdateInventoryReceiptItemRequest yêu cầu cập nhật chi tiết sản phẩm
type UpdateInventoryReceiptItemRequest struct {
	Quantity    *int32     `json:"quantity" validate:"omitempty,min=1"`
	UnitPrice   *string    `json:"unit_price"`
	ExpiryDate  *time.Time `json:"expiry_date"`
	BatchNumber *string    `json:"batch_number" validate:"omitempty,max=100"`
	Notes       *string    `json:"notes"`
}

// ListInventoryReceiptsRequest yêu cầu lấy danh sách phiếu nhập kho
type ListInventoryReceiptsRequest struct {
	SupplierName *string    `json:"supplier_name" form:"supplier_name"`
	Status       *int32     `json:"status" form:"status" validate:"omitempty,min=1,max=4"`
	FromDate     *time.Time `json:"from_date" form:"from_date"`
	ToDate       *time.Time `json:"to_date" form:"to_date"`
	Page         int32      `json:"page" form:"page" validate:"min=1"`
	Limit        int32      `json:"limit" form:"limit" validate:"min=1,max=100"`
}

// GetInventoryHistoryRequest yêu cầu lấy lịch sử tồn kho
type GetInventoryHistoryRequest struct {
	ProductID int32 `json:"product_id" form:"product_id" validate:"required,min=1"`
	Page      int32 `json:"page" form:"page" validate:"min=1"`
	Limit     int32 `json:"limit" form:"limit" validate:"min=1,max=100"`
}

// ApproveReceiptRequest - Request duyệt phiếu nhập kho
type ApproveReceiptRequest struct {
	ApprovedBy int32  `json:"approved_by" binding:"required" example:"1"`        // ID người duyệt
	Notes      string `json:"notes" example:"Phiếu nhập đã được kiểm tra và duyệt"` // Ghi chú khi duyệt
}

// ApproveReceiptRequest yêu cầu duyệt phiếu nhập kho
type ApproveReceiptRequestOld struct {
	CheckedByUserID int32   `json:"checked_by_user_id" validate:"required,min=1"`
	Notes           *string `json:"notes"`
}
