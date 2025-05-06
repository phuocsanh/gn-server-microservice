package product

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"gn-farm-go-server/internal/database"
	"gn-farm-go-server/internal/model/product"
	"gn-farm-go-server/internal/service"
)

// productService implements service.ProductService and service.ProductFactory
type productService struct {
	db *database.Queries
	// Registry for product types
	productRegistry map[int32]productCreator
}

// productCreator is a function type for creating products
type productCreator func(ctx context.Context, db *database.Queries, params interface{}) (*database.Product, error)

// Product creator functions
// createMushroomProduct creates a mushroom product
func createMushroomProduct(ctx context.Context, db *database.Queries, params interface{}) (*database.Product, error) {
	// Convert params to mushroom attributes
	mushroomAttrs, ok := params.(service.MushroomAttributes)
	if !ok {
		return nil, fmt.Errorf("invalid params type for mushroom product")
	}

	// Chuẩn bị thuộc tính cho sản phẩm
	attributes, _ := json.Marshal(mushroomAttrs)
	// Sử dụng tên thương hiệu làm tên sản phẩm nếu không có tên sản phẩm

	// Create product record
	productReq, ok := params.(service.ProductRequest)
	if !ok {
		// If not a full product request, create a minimal product
		productParams := database.CreateProductParams{
			ProductName:            "Mushroom Product",
			ProductPrice:           "0",
			ProductThumb:           "default.jpg",
			ProductPictures:        []string{},
			ProductVideos:          []string{},
			ProductType:            service.ProductTypeMushroom,
			SubProductType:         []int32{},
			ProductDiscountedPrice: "0",
			ProductAttributes:      attributes,
		}

		product, err := db.CreateProduct(ctx, productParams)
		if err != nil {
			return nil, err
		}

		return &product, nil
	}

	// Create full product with attributes
	productParams := database.CreateProductParams{
		ProductName:            productReq.ProductName,
		ProductPrice:           productReq.ProductPrice,
		ProductThumb:           productReq.ProductThumb,
		ProductPictures:        productReq.ProductPictures,
		ProductVideos:          productReq.ProductVideos,
		ProductType:            service.ProductTypeMushroom,
		SubProductType:         productReq.SubProductType,
		ProductDiscountedPrice: productReq.ProductDiscountedPrice,
		ProductAttributes:      productReq.ProductAttributes,
	}

	if productReq.ProductDescription != "" {
		productParams.ProductDescription = sql.NullString{String: productReq.ProductDescription, Valid: true}
	}

	if productReq.Discount != "" {
		productParams.Discount = sql.NullString{String: productReq.Discount, Valid: true}
	}

	if productReq.ProductQuantity > 0 {
		productParams.ProductQuantity = sql.NullInt32{Int32: productReq.ProductQuantity, Valid: true}
	}

	if productReq.ProductStatus > 0 {
		productParams.ProductStatus = sql.NullInt32{Int32: productReq.ProductStatus, Valid: true}
	}

	productParams.IsDraft = sql.NullBool{Bool: productReq.IsDraft, Valid: true}
	productParams.IsPublished = sql.NullBool{Bool: productReq.IsPublished, Valid: true}

	product, err := db.CreateProduct(ctx, productParams)
	if err != nil {
		return nil, err
	}

	return &product, nil
}

// createVegetableProduct creates a vegetable product
func createVegetableProduct(ctx context.Context, db *database.Queries, params interface{}) (*database.Product, error) {
	// Convert params to vegetable attributes
	vegetableAttrs, ok := params.(service.VegetableAttributes)
	if !ok {
		return nil, fmt.Errorf("invalid params type for vegetable product")
	}

	// Chuẩn bị thuộc tính cho sản phẩm
	attributes, _ := json.Marshal(vegetableAttrs)
	// Sử dụng tên nhà sản xuất làm tên sản phẩm nếu không có tên sản phẩm

	// Create product record
	productReq, ok := params.(service.ProductRequest)
	if !ok {
		// If not a full product request, create a minimal product
		productParams := database.CreateProductParams{
			ProductName:            "Vegetable Product",
			ProductPrice:           "0",
			ProductThumb:           "default.jpg",
			ProductPictures:        []string{},
			ProductVideos:          []string{},
			ProductType:            service.ProductTypeVegetable,
			SubProductType:         []int32{},
			ProductDiscountedPrice: "0",
			ProductAttributes:      attributes,
		}

		product, err := db.CreateProduct(ctx, productParams)
		if err != nil {
			return nil, err
		}

		return &product, nil
	}

	// Create full product with attributes
	productParams := database.CreateProductParams{
		ProductName:            productReq.ProductName,
		ProductPrice:           productReq.ProductPrice,
		ProductThumb:           productReq.ProductThumb,
		ProductPictures:        productReq.ProductPictures,
		ProductVideos:          productReq.ProductVideos,
		ProductType:            service.ProductTypeVegetable,
		SubProductType:         productReq.SubProductType,
		ProductDiscountedPrice: productReq.ProductDiscountedPrice,
		ProductAttributes:      productReq.ProductAttributes,
	}

	if productReq.ProductDescription != "" {
		productParams.ProductDescription = sql.NullString{String: productReq.ProductDescription, Valid: true}
	}

	if productReq.Discount != "" {
		productParams.Discount = sql.NullString{String: productReq.Discount, Valid: true}
	}

	if productReq.ProductQuantity > 0 {
		productParams.ProductQuantity = sql.NullInt32{Int32: productReq.ProductQuantity, Valid: true}
	}

	if productReq.ProductStatus > 0 {
		productParams.ProductStatus = sql.NullInt32{Int32: productReq.ProductStatus, Valid: true}
	}

	productParams.IsDraft = sql.NullBool{Bool: productReq.IsDraft, Valid: true}
	productParams.IsPublished = sql.NullBool{Bool: productReq.IsPublished, Valid: true}

	product, err := db.CreateProduct(ctx, productParams)
	if err != nil {
		return nil, err
	}

	return &product, nil
}

// createBonsaiProduct creates a bonsai product
func createBonsaiProduct(ctx context.Context, db *database.Queries, params interface{}) (*database.Product, error) {
	// Convert params to bonsai attributes
	bonsaiAttrs, ok := params.(service.BonsaiAttributes)
	if !ok {
		return nil, fmt.Errorf("invalid params type for bonsai product")
	}

	// Chuẩn bị thuộc tính cho sản phẩm
	attributes, _ := json.Marshal(bonsaiAttrs)
	// Sử dụng tên thương hiệu làm tên sản phẩm nếu không có tên sản phẩm

	// Create product record
	productReq, ok := params.(service.ProductRequest)
	if !ok {
		// If not a full product request, create a minimal product
		productParams := database.CreateProductParams{
			ProductName:            "Bonsai Product",
			ProductPrice:           "0",
			ProductThumb:           "default.jpg",
			ProductPictures:        []string{},
			ProductVideos:          []string{},
			ProductType:            service.ProductTypeBonsai,
			SubProductType:         []int32{},
			ProductDiscountedPrice: "0",
			ProductAttributes:      attributes,
		}

		product, err := db.CreateProduct(ctx, productParams)
		if err != nil {
			return nil, err
		}

		return &product, nil
	}

	// Create full product with attributes
	productParams := database.CreateProductParams{
		ProductName:            productReq.ProductName,
		ProductPrice:           productReq.ProductPrice,
		ProductThumb:           productReq.ProductThumb,
		ProductPictures:        productReq.ProductPictures,
		ProductVideos:          productReq.ProductVideos,
		ProductType:            service.ProductTypeBonsai,
		SubProductType:         productReq.SubProductType,
		ProductDiscountedPrice: productReq.ProductDiscountedPrice,
		ProductAttributes:      productReq.ProductAttributes,
	}

	if productReq.ProductDescription != "" {
		productParams.ProductDescription = sql.NullString{String: productReq.ProductDescription, Valid: true}
	}

	if productReq.Discount != "" {
		productParams.Discount = sql.NullString{String: productReq.Discount, Valid: true}
	}

	if productReq.ProductQuantity > 0 {
		productParams.ProductQuantity = sql.NullInt32{Int32: productReq.ProductQuantity, Valid: true}
	}

	if productReq.ProductStatus > 0 {
		productParams.ProductStatus = sql.NullInt32{Int32: productReq.ProductStatus, Valid: true}
	}

	productParams.IsDraft = sql.NullBool{Bool: productReq.IsDraft, Valid: true}
	productParams.IsPublished = sql.NullBool{Bool: productReq.IsPublished, Valid: true}

	product, err := db.CreateProduct(ctx, productParams)
	if err != nil {
		return nil, err
	}

	return &product, nil
}

// NewProductService creates a new product service with factory pattern
func NewProductService(db *database.Queries) service.ProductService {
	ps := &productService{
		db:              db,
		productRegistry: make(map[int32]productCreator),
	}

	// Register product types
	ps.registerProductType(service.ProductTypeMushroom, createMushroomProduct)
	ps.registerProductType(service.ProductTypeVegetable, createVegetableProduct)
	ps.registerProductType(service.ProductTypeBonsai, createBonsaiProduct)

	return ps
}

// registerProductType registers a product creator function for a specific product type
func (s *productService) registerProductType(productType int32, creator productCreator) {
	s.productRegistry[productType] = creator
}

// CreateProduct creates a product using the standard database params
func (s *productService) CreateProduct(ctx context.Context, params *database.CreateProductParams) (*database.Product, error) {
	product, err := s.db.CreateProduct(ctx, *params)
	if err != nil {
		return nil, err
	}
	return &product, nil
}

// CreateProductWithType creates a product using the factory pattern
func (s *productService) CreateProductWithType(ctx context.Context, productType int32, params interface{}) (*database.Product, error) {
	creator, exists := s.productRegistry[productType]
	if !exists {
		return nil, fmt.Errorf("%w: %d", service.ErrInvalidProductType, productType)
	}

	return creator(ctx, s.db, params)
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

// UpdateProductWithType updates a product using the factory pattern
func (s *productService) UpdateProductWithType(ctx context.Context, productType int32, id int32, params interface{}) (*database.Product, error) {
	// First get the existing product
	product, err := s.GetProduct(ctx, id)
	if err != nil {
		return nil, err
	}

	// Check if the product type matches
	if product.ProductType != productType {
		return nil, fmt.Errorf("product type mismatch: expected %d, got %d", productType, product.ProductType)
	}

	// Convert params to the appropriate type based on productType
	switch productType {
	case service.ProductTypeMushroom:
		// Update mushroom attributes
		mushroomAttrs, ok := params.(service.MushroomAttributes)
		if !ok {
			return nil, fmt.Errorf("invalid params type for mushroom product")
		}

		// Lấy sản phẩm hiện tại
		product, err := s.GetProduct(ctx, id)
		if err != nil {
			return nil, err
		}

		// Kiểm tra xem có phải loại Mushroom không
		if product.ProductType != service.ProductTypeMushroom {
			return nil, fmt.Errorf("product type mismatch: expected %d, got %d", service.ProductTypeMushroom, product.ProductType)
		}

		// Cập nhật thuộc tính
		attributes, _ := json.Marshal(mushroomAttrs)

		// Convert to database params
		updateParams := database.UpdateProductParams{
			ID:                id,
			ProductAttributes: attributes,
		}

		// Update product
		_, err = s.db.UpdateProduct(ctx, updateParams)
		if err != nil {
			return nil, err
		}

	case service.ProductTypeVegetable:
		// Update vegetable attributes
		vegetableAttrs, ok := params.(service.VegetableAttributes)
		if !ok {
			return nil, fmt.Errorf("invalid params type for vegetable product")
		}

		// Lấy sản phẩm hiện tại
		product, err := s.GetProduct(ctx, id)
		if err != nil {
			return nil, err
		}

		// Kiểm tra xem có phải loại Vegetable không
		if product.ProductType != service.ProductTypeVegetable {
			return nil, fmt.Errorf("product type mismatch: expected %d, got %d", service.ProductTypeVegetable, product.ProductType)
		}

		// Cập nhật thuộc tính
		attributes, _ := json.Marshal(vegetableAttrs)

		// Convert to database params
		updateParams := database.UpdateProductParams{
			ID:                id,
			ProductAttributes: attributes,
		}

		// Update product
		_, err = s.db.UpdateProduct(ctx, updateParams)
		if err != nil {
			return nil, err
		}

	case service.ProductTypeBonsai:
		// Update bonsai attributes
		bonsaiAttrs, ok := params.(service.BonsaiAttributes)
		if !ok {
			return nil, fmt.Errorf("invalid params type for bonsai product")
		}

		// Lấy sản phẩm hiện tại
		product, err := s.GetProduct(ctx, id)
		if err != nil {
			return nil, err
		}

		// Kiểm tra xem có phải loại Bonsai không
		if product.ProductType != service.ProductTypeBonsai {
			return nil, fmt.Errorf("product type mismatch: expected %d, got %d", service.ProductTypeBonsai, product.ProductType)
		}

		// Cập nhật thuộc tính
		attributes, _ := json.Marshal(bonsaiAttrs)

		// Convert to database params
		updateParams := database.UpdateProductParams{
			ID:                id,
			ProductAttributes: attributes,
		}

		// Update product
		_, err = s.db.UpdateProduct(ctx, updateParams)
		if err != nil {
			return nil, err
		}

	default:
		return nil, fmt.Errorf("%w: %d", service.ErrInvalidProductType, productType)
	}

	// Return the updated product
	return s.GetProduct(ctx, id)
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

func (s *productService) GetProductStats(ctx context.Context) (*product.ProductStats, error) {
	statsRow, err := s.db.GetProductStats(ctx)
	if err != nil {
		return nil, err
	}

	stats := &product.ProductStats{
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

func (s *mushroomService) CreateMushroom(ctx context.Context, name sql.NullString) (*database.Product, error) {
	// Tạo sản phẩm với loại Mushroom
	attributes, _ := json.Marshal(service.MushroomAttributes{
		Brand: name.String,
	})
	
	params := database.CreateProductParams{
		ProductName:            name.String,
		ProductPrice:           "0",
		ProductThumb:           "default.jpg",
		ProductPictures:        []string{},
		ProductVideos:          []string{},
		ProductType:            service.ProductTypeMushroom,
		SubProductType:         []int32{},
		ProductDiscountedPrice: "0",
		ProductAttributes:      attributes,
	}
	
	product, err := s.db.CreateProduct(ctx, params)
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (s *mushroomService) GetMushroom(ctx context.Context, id int32) (*database.Product, error) {
	// Lấy sản phẩm theo ID và kiểm tra loại
	product, err := s.db.GetProduct(ctx, id)
	if err != nil {
		return nil, err
	}
	
	// Kiểm tra xem có phải loại Mushroom không
	if product.ProductType != service.ProductTypeMushroom {
		return nil, fmt.Errorf("product is not a mushroom type")
	}
	
	return &product, nil
}

func (s *mushroomService) UpdateMushroom(ctx context.Context, params interface{}) (*database.Product, error) {
	// Chuyển đổi params sang đúng kiểu
	mushroomParams, ok := params.(service.MushroomAttributes)
	if !ok {
		return nil, fmt.Errorf("invalid params type for mushroom")
	}
	
	// Lấy ID từ params (giả định rằng params có trường ID)
	id := int32(0) // Cần lấy ID từ params
	
	// Lấy sản phẩm hiện tại
	product, err := s.db.GetProduct(ctx, id)
	if err != nil {
		return nil, err
	}
	
	// Kiểm tra xem có phải loại Mushroom không
	if product.ProductType != service.ProductTypeMushroom {
		return nil, fmt.Errorf("product is not a mushroom type")
	}
	
	// Cập nhật thuộc tính
	attributes, _ := json.Marshal(mushroomParams)
	
	updateParams := database.UpdateProductParams{
		ID:               id,
		ProductAttributes: attributes,
	}
	
	updatedProduct, err := s.db.UpdateProduct(ctx, updateParams)
	if err != nil {
		return nil, err
	}
	
	return &updatedProduct, nil
}

func (s *mushroomService) DeleteMushroom(ctx context.Context, id int32) error {
	// Lấy sản phẩm để kiểm tra loại
	product, err := s.db.GetProduct(ctx, id)
	if err != nil {
		return err
	}
	
	// Kiểm tra xem có phải loại Mushroom không
	if product.ProductType != service.ProductTypeMushroom {
		return fmt.Errorf("product is not a mushroom type")
	}
	
	// Xóa sản phẩm
	return s.db.DeleteProduct(ctx, id)
}

type vegetableService struct {
	db *database.Queries
}

func NewVegetableService(db *database.Queries) service.VegetableService {
	return &vegetableService{db: db}
}

func (s *vegetableService) CreateVegetable(ctx context.Context, name sql.NullString) (*database.Product, error) {
	// Tạo sản phẩm với loại Vegetable
	attributes, _ := json.Marshal(service.VegetableAttributes{
		Manufacturer: name.String,
	})
	
	params := database.CreateProductParams{
		ProductName:            name.String,
		ProductPrice:           "0",
		ProductThumb:           "default.jpg",
		ProductPictures:        []string{},
		ProductVideos:          []string{},
		ProductType:            service.ProductTypeVegetable,
		SubProductType:         []int32{},
		ProductDiscountedPrice: "0",
		ProductAttributes:      attributes,
	}
	
	product, err := s.db.CreateProduct(ctx, params)
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (s *vegetableService) GetVegetable(ctx context.Context, id int32) (*database.Product, error) {
	// Lấy sản phẩm theo ID và kiểm tra loại
	product, err := s.db.GetProduct(ctx, id)
	if err != nil {
		return nil, err
	}
	
	// Kiểm tra xem có phải loại Vegetable không
	if product.ProductType != service.ProductTypeVegetable {
		return nil, fmt.Errorf("product is not a vegetable type")
	}
	
	return &product, nil
}

func (s *vegetableService) UpdateVegetable(ctx context.Context, params interface{}) (*database.Product, error) {
	// Chuyển đổi params sang đúng kiểu
	vegetableParams, ok := params.(service.VegetableAttributes)
	if !ok {
		return nil, fmt.Errorf("invalid params type for vegetable")
	}
	
	// Lấy ID từ params (giả định rằng params có trường ID)
	id := int32(0) // Cần lấy ID từ params
	
	// Lấy sản phẩm hiện tại
	product, err := s.db.GetProduct(ctx, id)
	if err != nil {
		return nil, err
	}
	
	// Kiểm tra xem có phải loại Vegetable không
	if product.ProductType != service.ProductTypeVegetable {
		return nil, fmt.Errorf("product is not a vegetable type")
	}
	
	// Cập nhật thuộc tính
	attributes, _ := json.Marshal(vegetableParams)
	
	updateParams := database.UpdateProductParams{
		ID:               id,
		ProductAttributes: attributes,
	}
	
	updatedProduct, err := s.db.UpdateProduct(ctx, updateParams)
	if err != nil {
		return nil, err
	}
	
	return &updatedProduct, nil
}

func (s *vegetableService) DeleteVegetable(ctx context.Context, id int32) error {
	// Lấy sản phẩm để kiểm tra loại
	product, err := s.db.GetProduct(ctx, id)
	if err != nil {
		return err
	}
	
	// Kiểm tra xem có phải loại Vegetable không
	if product.ProductType != service.ProductTypeVegetable {
		return fmt.Errorf("product is not a vegetable type")
	}
	
	// Xóa sản phẩm
	return s.db.DeleteProduct(ctx, id)
}

type bonsaiService struct {
	db *database.Queries
}

func NewBonsaiService(db *database.Queries) service.BonsaiService {
	return &bonsaiService{db: db}
}

func (s *bonsaiService) CreateBonsai(ctx context.Context, name sql.NullString) (*database.Product, error) {
	// Tạo sản phẩm với loại Bonsai
	attributes, _ := json.Marshal(service.BonsaiAttributes{
		Brand: name.String,
	})
	
	params := database.CreateProductParams{
		ProductName:            name.String,
		ProductPrice:           "0",
		ProductThumb:           "default.jpg",
		ProductPictures:        []string{},
		ProductVideos:          []string{},
		ProductType:            service.ProductTypeBonsai,
		SubProductType:         []int32{},
		ProductDiscountedPrice: "0",
		ProductAttributes:      attributes,
	}
	
	product, err := s.db.CreateProduct(ctx, params)
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (s *bonsaiService) GetBonsai(ctx context.Context, id int32) (*database.Product, error) {
	// Lấy sản phẩm theo ID và kiểm tra loại
	product, err := s.db.GetProduct(ctx, id)
	if err != nil {
		return nil, err
	}
	
	// Kiểm tra xem có phải loại Bonsai không
	if product.ProductType != service.ProductTypeBonsai {
		return nil, fmt.Errorf("product is not a bonsai type")
	}
	
	return &product, nil
}

func (s *bonsaiService) UpdateBonsai(ctx context.Context, params interface{}) (*database.Product, error) {
	// Chuyển đổi params sang đúng kiểu
	bonsaiParams, ok := params.(service.BonsaiAttributes)
	if !ok {
		return nil, fmt.Errorf("invalid params type for bonsai")
	}
	
	// Lấy ID từ params (giả định rằng params có trường ID)
	id := int32(0) // Cần lấy ID từ params
	
	// Lấy sản phẩm hiện tại
	product, err := s.db.GetProduct(ctx, id)
	if err != nil {
		return nil, err
	}
	
	// Kiểm tra xem có phải loại Bonsai không
	if product.ProductType != service.ProductTypeBonsai {
		return nil, fmt.Errorf("product is not a bonsai type")
	}
	
	// Cập nhật thuộc tính
	attributes, _ := json.Marshal(bonsaiParams)
	
	updateParams := database.UpdateProductParams{
		ID:               id,
		ProductAttributes: attributes,
	}
	
	updatedProduct, err := s.db.UpdateProduct(ctx, updateParams)
	if err != nil {
		return nil, err
	}
	
	return &updatedProduct, nil
}

func (s *bonsaiService) DeleteBonsai(ctx context.Context, id int32) error {
	// Lấy sản phẩm để kiểm tra loại
	product, err := s.db.GetProduct(ctx, id)
	if err != nil {
		return err
	}
	
	// Kiểm tra xem có phải loại Bonsai không
	if product.ProductType != service.ProductTypeBonsai {
		return fmt.Errorf("product is not a bonsai type")
	}
	
	// Xóa sản phẩm
	return s.db.DeleteProduct(ctx, id)
}