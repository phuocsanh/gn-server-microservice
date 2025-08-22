package manage

import (
	"gn-farm-go-server/internal/controller/inventory"
	"gn-farm-go-server/internal/middlewares"

	"github.com/gin-gonic/gin"
)

type InventoryManageRouter struct{}

func (ir *InventoryManageRouter) InitInventoryManageRouter(Router *gin.RouterGroup) {
	
	// Public routes for testing
	inventoryRouterPublic := Router.Group("/inventory")
	{
		// Public endpoint for testing stock-in functionality
		inventoryRouterPublic.POST("/stock-in", inventory.Inventory.ProcessStockIn)
	}

	inventoryRouterPrivate := Router.Group("/manage/inventory")
	inventoryRouterPrivate.Use(middlewares.AuthenMiddleware())
	{
		// Inventory Receipt routes
		inventoryRouterPrivate.POST("/receipt", inventory.Inventory.CreateInventoryReceipt)
		inventoryRouterPrivate.GET("/receipts", inventory.Inventory.ListInventoryReceipts)
		inventoryRouterPrivate.GET("/receipt/:id", inventory.Inventory.GetInventoryReceipt)
		inventoryRouterPrivate.GET("/receipt/code/:code", inventory.Inventory.GetInventoryReceiptByCode)
		inventoryRouterPrivate.PUT("/receipt/:id", inventory.Inventory.UpdateInventoryReceipt)
		inventoryRouterPrivate.DELETE("/receipt/:id", inventory.Inventory.DeleteInventoryReceipt)

		// Inventory Receipt Actions
		inventoryRouterPrivate.POST("/receipt/:id/approve", inventory.Inventory.ApproveInventoryReceipt)
		inventoryRouterPrivate.POST("/receipt/:id/complete", inventory.Inventory.CompleteInventoryReceipt)
		inventoryRouterPrivate.POST("/receipt/:id/cancel", inventory.Inventory.CancelInventoryReceipt)

		// Inventory Receipt Items routes
		inventoryRouterPrivate.GET("/receipt/:id/items", inventory.Inventory.GetInventoryReceiptItems)
		inventoryRouterPrivate.PUT("/receipt/item/:id", inventory.Inventory.UpdateInventoryReceiptItem)
		inventoryRouterPrivate.DELETE("/receipt/item/:id", inventory.Inventory.DeleteInventoryReceiptItem)

		// Inventory Stock Management routes
		inventoryRouterPrivate.POST("/stock-in", inventory.Inventory.ProcessStockIn)

		// Inventory History routes
		inventoryRouterPrivate.GET("/product-history", inventory.Inventory.GetInventoryHistory)
		inventoryRouterPrivate.GET("/product-history/:product_id", inventory.Inventory.GetInventoryHistory)
		inventoryRouterPrivate.GET("/receipt-items/:receipt_id", inventory.Inventory.GetInventoryReceiptItems)
	}

}
