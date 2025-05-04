package main

import (
	_ "gn-farm-go-server/cmd/swag/docs"
	"gn-farm-go-server/internal/initialize"
	"log"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title           API Documentation GN-FARM
// @version         1.0.0
// @description     This is a sample server celler server.
// @termsOfService  github.com/anonystick/go-ecommerce-backend-go

// @contact.name   TEAM TIPSGO
// @contact.url    github.com/anonystick/go-ecommerce-backend-go
// @contact.email  tipsgo@gmail.com

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8002
// @BasePath  /v1
// @schema http
func main() {
	// Khởi tạo router
	r := initialize.Run()
	log.Println("🚀 Hot reload: server started - hot reloading is working!")

	// Cấu hình Swagger UI
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Khởi động server
	r.Run(":8002")
}
