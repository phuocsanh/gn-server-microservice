package product

import (
	"context"
	"database/sql"
	"gn-farm-go-server/internal/database"
	"gn-farm-go-server/internal/service"
)

// productTypeService implements service.ProductTypeService
type productTypeService struct {
	db *database.Queries
}

// NewProductTypeService creates a new product type service
func NewProductTypeService(db *database.Queries) service.ProductTypeService {
	return &productTypeService{db: db}
}

func (s *productTypeService) GetProductType(ctx context.Context, id int32) (*database.ProductType, error) {
	productType, err := s.db.GetProductType(ctx, id)
	if err != nil {
		return nil, err
	}
	return &productType, nil
}

func (s *productTypeService) ListProductTypes(ctx context.Context) ([]*database.ProductType, error) {
	productTypes, err := s.db.ListProductTypes(ctx)
	if err != nil {
		return nil, err
	}
	result := make([]*database.ProductType, len(productTypes))
	for i := range productTypes {
		result[i] = &productTypes[i]
	}
	return result, nil
}

func (s *productTypeService) CreateProductType(ctx context.Context, name, description string) (*database.ProductType, error) {
	params := database.CreateProductTypeParams{
		Name:        name,
		Description: sql.NullString{String: description, Valid: description != ""},
	}
	productType, err := s.db.CreateProductType(ctx, params)
	if err != nil {
		return nil, err
	}
	return &productType, nil
}

func (s *productTypeService) UpdateProductType(ctx context.Context, id int32, name, description string) (*database.ProductType, error) {
	params := database.UpdateProductTypeParams{
		ID:          id,
		Name:        name,
	}
	productType, err := s.db.UpdateProductType(ctx, params)
	if err != nil {
		return nil, err
	}
	return &productType, nil
}

func (s *productTypeService) DeleteProductType(ctx context.Context, id int32) error {
	return s.db.DeleteProductType(ctx, id)
}
