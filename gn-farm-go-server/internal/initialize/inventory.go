package initialize

import (
	"gn-farm-go-server/global"
	"gn-farm-go-server/internal/controller/inventory"
	"gn-farm-go-server/internal/database"
	"gn-farm-go-server/internal/wire"
)

func InitInventoryService() {
	queries := database.New(global.Pgdbc)

	// Initialize inventory controller using wire
	inventoryController := wire.InitializeInventoryController(queries)
	
	inventory.Inventory = inventoryController
}
