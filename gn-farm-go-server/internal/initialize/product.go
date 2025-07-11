package initialize

import (
	"gn-farm-go-server/global"
	"gn-farm-go-server/internal/database"
	"gn-farm-go-server/internal/service"
	"gn-farm-go-server/internal/wire"
)

func InitProductService() {
	queries := database.New(global.Pgdbc)

	// Initialize product services with file tracking support
	service.InitProductService(wire.InitializeProductServiceWithFileTracking(queries))
	service.InitMushroomService(wire.InitializeMushroomServiceWithFileTracking(queries))
	service.InitVegetableService(wire.InitializeVegetableServiceWithFileTracking(queries))
	service.InitBonsaiService(wire.InitializeBonsaiServiceWithFileTracking(queries))

	// Initialize product type services
	service.ProductType = wire.InitializeProductTypeService(queries)
	service.ProductSubtype = wire.InitializeProductSubtypeService(queries)
	service.ProductSubtypeRelation = wire.InitializeProductSubtypeRelationService(queries)
}