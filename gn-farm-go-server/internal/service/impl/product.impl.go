package impl

import (
	"context"
	"gn-farm-go-server/internal/database"
	"gn-farm-go-server/internal/service"
)

type productService struct {
	db *database.Queries
}

func NewProductService(db *database.Queries) service.ProductService {
	return &productService{db: db}
}

func (s *productService) CreateProduct(ctx context.Context, params *database.CreateProductParams) (*database.Product, error) {
	product, err := s.db.CreateProduct(ctx, *params)
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (s *productService) GetProduct(ctx context.Context, id int32) (*database.Product, error) {
	product, err := s.db.GetProduct(ctx, id)
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (s *productService) ListProducts(ctx context.Context, limit, offset int32) ([]*database.Product, error) {
	products, err := s.db.ListProducts(ctx, database.ListProductsParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, err
	}
	result := make([]*database.Product, len(products))
	for i := range products {
		result[i] = &products[i]
	}
	return result, nil
}

func (s *productService) UpdateProduct(ctx context.Context, params *database.UpdateProductParams) (*database.Product, error) {
	product, err := s.db.UpdateProduct(ctx, *params)
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (s *productService) DeleteProduct(ctx context.Context, id int32) error {
	return s.db.DeleteProduct(ctx, id)
}

func (s *productService) SearchProducts(ctx context.Context, query string, limit, offset int32) ([]*database.Product, error) {
	products, err := s.db.SearchProducts(ctx, database.SearchProductsParams{
		ProductName: query,
		Limit:       limit,
		Offset:      offset,
	})
	if err != nil {
		return nil, err
	}
	result := make([]*database.Product, len(products))
	for i := range products {
		result[i] = &products[i]
	}
	return result, nil
}

func (s *productService) FilterProducts(ctx context.Context, params database.FilterProductsParams) ([]*database.Product, error) {
	products, err := s.db.FilterProducts(ctx, params)
	if err != nil {
		return nil, err
	}
	result := make([]*database.Product, len(products))
	for i := range products {
		product := products[i]
		result[i] = &product
	}
	return result, nil
}

func (s *productService) GetProductStats(ctx context.Context) (*service.ProductStats, error) {
	statsRow, err := s.db.GetProductStats(ctx)
	if err != nil {
		return nil, err
	}

	stats := &service.ProductStats{
		TotalProducts:      statsRow.TotalProducts,
		InStockProducts:    statsRow.InStockProducts,
		OutOfStockProducts: statsRow.OutOfStockProducts,
		TotalProductsSold:  statsRow.TotalProductsSold,
		AverageRating:      statsRow.AverageRating,
		MinPrice:           statsRow.MinPrice,
		MaxPrice:           statsRow.MaxPrice,
		AvgPrice:           statsRow.AvgPrice,
		TotalCategories:    statsRow.TotalCategories,
	}
	return stats, nil
}

func (s *productService) BulkUpdateProducts(ctx context.Context, params []database.UpdateProductParams) ([]*database.Product, error) {
	products := make([]*database.Product, 0, len(params))
	for _, param := range params {
		product, err := s.db.UpdateProduct(ctx, param)
		if err != nil {
			return nil, err
		}
		products = append(products, &product)
	}
	return products, nil
}

type mushroomService struct {
	db *database.Queries
}

func NewMushroomService(db *database.Queries) service.MushroomService {
	return &mushroomService{db: db}
}

func (s *mushroomService) CreateMushroom(ctx context.Context, params *database.CreateMushroomParams) (*database.Mushroom, error) {
	mushroom, err := s.db.CreateMushroom(ctx, *params)
	if err != nil {
		return nil, err
	}
	return &mushroom, nil
}

func (s *mushroomService) GetMushroom(ctx context.Context, id int32) (*database.Mushroom, error) {
	mushroom, err := s.db.GetMushroom(ctx, id)
	if err != nil {
		return nil, err
	}
	return &mushroom, nil
}

func (s *mushroomService) UpdateMushroom(ctx context.Context, params *database.UpdateMushroomParams) (*database.Mushroom, error) {
	mushroom, err := s.db.UpdateMushroom(ctx, *params)
	if err != nil {
		return nil, err
	}
	return &mushroom, nil
}

func (s *mushroomService) DeleteMushroom(ctx context.Context, id int32) error {
	return s.db.DeleteMushroom(ctx, id)
}

type vegetableService struct {
	db *database.Queries
}

func NewVegetableService(db *database.Queries) service.VegetableService {
	return &vegetableService{db: db}
}

func (s *vegetableService) CreateVegetable(ctx context.Context, params *database.CreateVegetableParams) (*database.Vegetable, error) {
	vegetable, err := s.db.CreateVegetable(ctx, *params)
	if err != nil {
		return nil, err
	}
	return &vegetable, nil
}

func (s *vegetableService) GetVegetable(ctx context.Context, id int32) (*database.Vegetable, error) {
	vegetable, err := s.db.GetVegetable(ctx, id)
	if err != nil {
		return nil, err
	}
	return &vegetable, nil
}

func (s *vegetableService) UpdateVegetable(ctx context.Context, params *database.UpdateVegetableParams) (*database.Vegetable, error) {
	vegetable, err := s.db.UpdateVegetable(ctx, *params)
	if err != nil {
		return nil, err
	}
	return &vegetable, nil
}

func (s *vegetableService) DeleteVegetable(ctx context.Context, id int32) error {
	return s.db.DeleteVegetable(ctx, id)
}

type bonsaiService struct {
	db *database.Queries
}

func NewBonsaiService(db *database.Queries) service.BonsaiService {
	return &bonsaiService{db: db}
}

func (s *bonsaiService) CreateBonsai(ctx context.Context, params *database.CreateBonsaiParams) (*database.Bonsai, error) {
	bonsai, err := s.db.CreateBonsai(ctx, *params)
	if err != nil {
		return nil, err
	}
	return &bonsai, nil
}

func (s *bonsaiService) GetBonsai(ctx context.Context, id int32) (*database.Bonsai, error) {
	bonsai, err := s.db.GetBonsai(ctx, id)
	if err != nil {
		return nil, err
	}
	return &bonsai, nil
}

func (s *bonsaiService) UpdateBonsai(ctx context.Context, params *database.UpdateBonsaiParams) (*database.Bonsai, error) {
	bonsai, err := s.db.UpdateBonsai(ctx, *params)
	if err != nil {
		return nil, err
	}
	return &bonsai, nil
}

func (s *bonsaiService) DeleteBonsai(ctx context.Context, id int32) error {
	return s.db.DeleteBonsai(ctx, id)
}