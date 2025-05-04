//go:build wireinject
// +build wireinject

package wire

import (
	"gn-farm-go-server/internal/database"
	"gn-farm-go-server/internal/service"
	"gn-farm-go-server/internal/service/impl"

	"github.com/google/wire"
)

var productSet = wire.NewSet(
	impl.NewProductService,
	impl.NewMushroomService,
	impl.NewVegetableService,
	impl.NewBonsaiService,
)

func InitializeProductService(db *database.Queries) service.ProductService {
	wire.Build(productSet)
	return nil
}

func InitializeMushroomService(db *database.Queries) service.MushroomService {
	wire.Build(productSet)
	return nil
}

func InitializeVegetableService(db *database.Queries) service.VegetableService {
	wire.Build(productSet)
	return nil
}

func InitializeBonsaiService(db *database.Queries) service.BonsaiService {
	wire.Build(productSet)
	return nil
}
