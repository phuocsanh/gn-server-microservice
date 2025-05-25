package service

import (
	"context"
	"gn-farm-go-server/internal/database"
	"gn-farm-go-server/internal/vo/product"
)

// IProductTypeService interface for product type operations following product pattern
type IProductTypeService interface {
	GetProductType(ctx context.Context, id int32) (codeResult int, out product.ProductTypeResponse, err error)
	ListProductTypes(ctx context.Context) (codeResult int, out []product.ProductTypeResponse, err error)
	CreateProductType(ctx context.Context, req *product.ProductTypeRequest) (codeResult int, out product.ProductTypeResponse, err error)
	UpdateProductType(ctx context.Context, id int32, req *product.ProductTypeRequest) (codeResult int, out product.ProductTypeResponse, err error)
	DeleteProductType(ctx context.Context, id int32) (codeResult int, err error)
}

// Legacy ProductTypeService interface for backward compatibility
type ProductTypeService interface {
	GetProductType(ctx context.Context, id int32) (codeResult int, out product.ProductTypeResponse, err error)
	ListProductTypes(ctx context.Context) (codeResult int, out []product.ProductTypeResponse, err error)
	CreateProductType(ctx context.Context, req *product.ProductTypeRequest) (codeResult int, out product.ProductTypeResponse, err error)
	UpdateProductType(ctx context.Context, id int32, req *product.ProductTypeRequest) (codeResult int, out product.ProductTypeResponse, err error)
	DeleteProductType(ctx context.Context, id int32) (codeResult int, err error)
}

// ProductSubtypeService interface for product subtype operations
type ProductSubtypeService interface {
	GetProductSubtype(ctx context.Context, id int32) (*database.ProductSubtype, error)
	ListProductSubtypes(ctx context.Context) ([]database.ProductSubtype, error)
	ListProductSubtypesByType(ctx context.Context, productTypeID int32) ([]database.ProductSubtype, error)
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
