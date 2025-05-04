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
	service.Product = wire.InitializeProductService(queries)
	service.Mushroom = wire.InitializeMushroomService(queries)
	service.Vegetable = wire.InitializeVegetableService(queries)
	service.Bonsai = wire.InitializeBonsaiService(queries)

	// Initialize product type services
	service.ProductType = wire.InitializeProductTypeService(queries)
	service.ProductSubtype = wire.InitializeProductSubtypeService(queries)
	service.ProductSubtypeRelation = wire.InitializeProductSubtypeRelationService(queries)
}