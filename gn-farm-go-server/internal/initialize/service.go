package initialize

import (
	"gn-farm-go-server/global"
	"gn-farm-go-server/internal/config"
	"gn-farm-go-server/internal/database"
	"gn-farm-go-server/internal/service"
	"gn-farm-go-server/internal/service/upload"
	"gn-farm-go-server/internal/wire"
	"go.uber.org/zap"
)

// InitServiceInterface initializes all service interfaces
func InitServiceInterface() {
	// Initialize user services
	userAuth, err := wire.InitUserAuthService()
	if err != nil {
		panic(err)
	}
	service.InitUserAuth(userAuth)
	
	// Initialize file tracking service first (required by upload service)
	db := database.New(global.Pgdbc)
	fileTrackingService, err := wire.InitFileTrackingService(db)
	if err != nil {
		global.Logger.Error("Failed to initialize file tracking service", zap.Error(err))
		panic(err)
	}
	service.SetFileTrackingService(fileTrackingService)

	// Initialize upload service
	uploadService, err := wire.InitUploadService()
	if err != nil {
		global.Logger.Error("Failed to initialize upload service", zap.Error(err))
		panic(err)
	}
	service.SetUploadService(uploadService)

	// Inject file tracking service into upload service
	if cloudinaryService, ok := uploadService.(*upload.CloudinaryService); ok {
		adapter := config.NewFileTrackingServiceAdapter(fileTrackingService)
		cloudinaryService.SetFileTrackingService(adapter)
		global.Logger.Info("File tracking service injected into upload service")
	}
}
