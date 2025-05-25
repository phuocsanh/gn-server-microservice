package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"time"

	"gn-farm-go-server/internal/database"

	_ "github.com/lib/pq"
)

type ProductData struct {
	Name        string
	Type        int32
	SubTypes    []int32
	Price       string
	Discount    string
	Description string
	Pictures    []string
	Attributes  map[string]interface{}
}

func main() {
	// Seed random number generator
	rand.Seed(time.Now().UnixNano())

	// Connect to database
	dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		"localhost", 5432, "postgres", "123456", "GO_GN_FARM")

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	queries := database.New(db)
	ctx := context.Background()

	// Seed products
	if err := seedProducts(ctx, queries); err != nil {
		log.Fatal("Failed to seed products:", err)
	}

	fmt.Println("Successfully seeded 200 products!")
}

func seedProducts(ctx context.Context, queries *database.Queries) error {
	products := generateProductData()

	for i, product := range products {
		// Convert attributes to JSON
		attributesJSON, err := json.Marshal(product.Attributes)
		if err != nil {
			return fmt.Errorf("failed to marshal attributes for product %d: %v", i, err)
		}

		// Create product
		params := database.CreateProductParams{
			ProductName:            product.Name,
			ProductPrice:           product.Price,
			ProductThumb:           product.Pictures[0], // First image as thumbnail
			ProductPictures:        product.Pictures,
			ProductVideos:          []string{},
			ProductType:            product.Type,
			SubProductType:         product.SubTypes,
			ProductDiscountedPrice: calculateDiscountedPrice(product.Price, product.Discount),
			ProductAttributes:      attributesJSON,
			ProductDescription:     sql.NullString{String: product.Description, Valid: true},
			Discount:               sql.NullString{String: product.Discount, Valid: true},
			ProductQuantity:        sql.NullInt32{Int32: int32(rand.Intn(100) + 10), Valid: true}, // 10-109
			ProductStatus:          sql.NullInt32{Int32: 1, Valid: true}, // Active
			IsPublished:            sql.NullBool{Bool: true, Valid: true},
			IsDraft:                sql.NullBool{Bool: false, Valid: true},
		}

		_, err = queries.CreateProduct(ctx, params)
		if err != nil {
			return fmt.Errorf("failed to create product %d: %v", i, err)
		}

		if (i+1)%20 == 0 {
			fmt.Printf("Created %d products...\n", i+1)
		}
	}

	return nil
}

func calculateDiscountedPrice(price, discount string) string {
	// Simple calculation - in real app you'd parse and calculate properly
	return price // For now, just return original price
}

func generateProductData() []ProductData {
	var products []ProductData

	// Generate 70 Mushroom products (Type 1)
	mushroomNames := []string{
		"Nấm Shiitake Tươi", "Nấm Đùi Gà Hữu Cơ", "Nấm Kim Châm", "Nấm Bào Ngư", "Nấm Mỡ",
		"Nấm Rơm Tươi", "Nấm Hương Khô", "Nấm Linh Chi", "Nấm Đông Cô", "Nấm Tuyết",
		"Nấm Bạch Linh", "Nấm Mèo", "Nấm Sò", "Nấm Dẻ Cười", "Nấm Matsutake",
	}
	mushroomImages := []string{
		"https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500",
		"https://images.unsplash.com/photo-1518864677427-aca22d1e7e4e?w=500",
		"https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=500",
		"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500",
		"https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=500",
		"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500",
	}

	for i := 0; i < 70; i++ {
		name := mushroomNames[i%len(mushroomNames)]
		if i >= len(mushroomNames) {
			name = fmt.Sprintf("%s %d", name, i/len(mushroomNames)+1)
		}

		products = append(products, ProductData{
			Name: name, Type: 1, SubTypes: []int32{int32((i % 3) + 1)},
			Price: fmt.Sprintf("%d", 25000+rand.Intn(50000)),
			Discount: fmt.Sprintf("%d", rand.Intn(20)),
			Description: fmt.Sprintf("Nấm %s tươi ngon, giàu dinh dưỡng, thích hợp cho nhiều món ăn", name),
			Pictures: []string{
				mushroomImages[rand.Intn(len(mushroomImages))],
				mushroomImages[rand.Intn(len(mushroomImages))],
			},
			Attributes: map[string]interface{}{
				"origin": []string{"Đà Lạt", "Sapa", "Tam Đảo"}[rand.Intn(3)],
				"weight": fmt.Sprintf("%dg", (rand.Intn(5)+1)*100),
				"freshness": "Tươi",
			},
		})
	}

	// Generate 80 Vegetable products (Type 2)
	vegetableNames := []string{
		"Cà Chua Cherry", "Rau Muống", "Cải Bó Xôi", "Xà Lách", "Cà Rót",
		"Ớt Chuông", "Dưa Chuột", "Cà Tím", "Bí Đỏ", "Bí Ngô",
		"Củ Cải Trắng", "Cà Rót Tím", "Rau Cần Tây", "Rau Thơm", "Húng Quế",
		"Rau Má", "Rau Dền", "Cải Thảo", "Su Hào", "Bắp Cải",
	}
	vegetableImages := []string{
		"https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500",
		"https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500",
		"https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=500",
		"https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=500",
		"https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500",
		"https://images.unsplash.com/photo-1461354464878-ad92f492a5a0?w=500",
	}

	for i := 0; i < 80; i++ {
		name := vegetableNames[i%len(vegetableNames)]
		if i >= len(vegetableNames) {
			name = fmt.Sprintf("%s %d", name, i/len(vegetableNames)+1)
		}

		products = append(products, ProductData{
			Name: name, Type: 2, SubTypes: []int32{int32((i % 4) + 1)},
			Price: fmt.Sprintf("%d", 15000+rand.Intn(35000)),
			Discount: fmt.Sprintf("%d", rand.Intn(15)),
			Description: fmt.Sprintf("Rau %s tươi sạch, hữu cơ, giàu vitamin và khoáng chất", name),
			Pictures: []string{
				vegetableImages[rand.Intn(len(vegetableImages))],
				vegetableImages[rand.Intn(len(vegetableImages))],
			},
			Attributes: map[string]interface{}{
				"origin": []string{"Đà Lạt", "Lâm Đồng", "Hà Nội"}[rand.Intn(3)],
				"weight": fmt.Sprintf("%dg", (rand.Intn(8)+1)*100),
				"organic": rand.Intn(2) == 1,
				"pesticide_free": true,
			},
		})
	}

	// Generate 50 Bonsai products (Type 3)
	bonsaiNames := []string{
		"Bonsai Tùng La Hán", "Bonsai Sanh", "Bonsai Sung", "Bonsai Đa", "Bonsai Cẩm Lai",
		"Bonsai Tùng Thơm", "Bonsai Linh Sam", "Bonsai Duối", "Bonsai Trúc", "Bonsai Tùng Lá Kim",
		"Bonsai Hoa Giấy", "Bonsai Cúc Tana", "Bonsai Nguyệt Quế", "Bonsai Tùng Bách", "Bonsai Lá Nhỏ",
	}
	bonsaiImages := []string{
		"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500",
		"https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500",
		"https://images.unsplash.com/photo-1463320726281-696a485928c7?w=500",
		"https://images.unsplash.com/photo-1509423350716-97f2360af03e?w=500",
		"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500",
		"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500",
	}

	for i := 0; i < 50; i++ {
		name := bonsaiNames[i%len(bonsaiNames)]
		if i >= len(bonsaiNames) {
			name = fmt.Sprintf("%s %d", name, i/len(bonsaiNames)+1)
		}

		products = append(products, ProductData{
			Name: name, Type: 3, SubTypes: []int32{int32((i % 2) + 1)},
			Price: fmt.Sprintf("%d", 150000+rand.Intn(500000)),
			Discount: fmt.Sprintf("%d", rand.Intn(10)),
			Description: fmt.Sprintf("Cây %s đẹp, dáng cổ thụ, thích hợp trang trí nội thất", name),
			Pictures: []string{
				bonsaiImages[rand.Intn(len(bonsaiImages))],
				bonsaiImages[rand.Intn(len(bonsaiImages))],
			},
			Attributes: map[string]interface{}{
				"age": fmt.Sprintf("%d năm", rand.Intn(10)+3),
				"height": fmt.Sprintf("%dcm", rand.Intn(50)+20),
				"pot_included": true,
				"care_level": []string{"Dễ", "Trung bình", "Khó"}[rand.Intn(3)],
			},
		})
	}

	return products
}