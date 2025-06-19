//go:build wireinject
// +build wireinject

package wire

import (
	"gn-farm-go-server/internal/controller/inventory"
	"gn-farm-go-server/internal/database"
	"gn-farm-go-server/internal/service"
	inventoryImpl "gn-farm-go-server/internal/service/impl/inventory"

	"github.com/google/wire"
)

var inventorySet = wire.NewSet(
	inventoryImpl.NewInventoryService,
	inventory.NewInventoryController,
)

func InitializeInventoryService(db *database.Queries) service.IInventoryService {
	wire.Build(inventorySet)
	return nil
}

func InitializeInventoryController(db *database.Queries) *inventory.InventoryController {
	wire.Build(inventorySet)
	return nil
}
