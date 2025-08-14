package initialize

import (
	"gn-farm-go-server/global"
	"gn-farm-go-server/internal/database"
	"gn-farm-go-server/internal/service"
	"gn-farm-go-server/internal/wire"
)

func InitProductService() {
	queries := database.New(global.Pgdbc)

	// Initialize product services
	service.InitProductService(wire.InitializeProductService(queries))
	service.InitMushroomService(wire.InitializeMushroomService(queries))
	service.InitVegetableService(wire.InitializeVegetableService(queries))
	service.InitBonsaiService(wire.InitializeBonsaiService(queries))

	// Initialize product type services
	service.ProductType = wire.InitializeProductTypeService(queries)
	service.ProductSubtype = wire.InitializeProductSubtypeService(queries)
	service.ProductSubtypeRelation = wire.InitializeProductSubtypeRelationService(queries)
}