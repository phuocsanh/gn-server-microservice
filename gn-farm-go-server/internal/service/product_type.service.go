package service

import (
	"context"
	"gn-farm-go-server/internal/database"
)

// ProductTypeService interface for product type operations
type ProductTypeService interface {
	GetProductType(ctx context.Context, id int32) (*database.ProductType, error)
	ListProductTypes(ctx context.Context) ([]*database.ProductType, error)
	CreateProductType(ctx context.Context, name, description string) (*database.ProductType, error)
	UpdateProductType(ctx context.Context, id int32, name, description string) (*database.ProductType, error)
	DeleteProductType(ctx context.Context, id int32) error
}

// ProductSubtypeService interface for product subtype operations
type ProductSubtypeService interface {
	GetProductSubtype(ctx context.Context, id int32) (*database.ProductSubtype, error)
	ListProductSubtypes(ctx context.Context) ([]*database.ProductSubtype, error)
	ListProductSubtypesByType(ctx context.Context, productTypeID int32) ([]*database.ProductSubtype, error)
	CreateProductSubtype(ctx context.Context, name, description string) (*database.ProductSubtype, error)
	UpdateProductSubtype(ctx context.Context, id int32, name, description string) (*database.ProductSubtype, error)
	DeleteProductSubtype(ctx context.Context, id int32) error
	AddProductSubtypeMapping(ctx context.Context, productTypeID, productSubtypeID int32) error
	RemoveProductSubtypeMapping(ctx context.Context, productTypeID, productSubtypeID int32) error
}

// ProductSubtypeRelationService interface for product subtype relation operations
type ProductSubtypeRelationService interface {
	GetProductSubtypeRelations(ctx context.Context, productID int32) ([]*database.GetProductSubtypeRelationsRow, error)
	AddProductSubtypeRelation(ctx context.Context, productID, productSubtypeID int32) error
	RemoveProductSubtypeRelation(ctx context.Context, productID, productSubtypeID int32) error
	RemoveAllProductSubtypeRelations(ctx context.Context, productID int32) error
}

var (
	ProductType           ProductTypeService
	ProductSubtype        ProductSubtypeService
	ProductSubtypeRelation ProductSubtypeRelationService
)
