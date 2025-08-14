package routers

import (
	"gn-farm-go-server/internal/controller/upload"
	"gn-farm-go-server/internal/middlewares"
	"gn-farm-go-server/internal/service"
	"gn-farm-go-server/internal/service/file_tracking"

	"github.com/gin-gonic/gin"
)

// UploadRouter quản lý các route liên quan đến upload file
type UploadRouter struct {
	// UploadHandler xử lý các yêu cầu upload file
	UploadHandler upload.UploadHandler
	// FileUploadMiddleware để track file uploads
	FileUploadMiddleware *file_tracking.FileUploadMiddleware
}

// NewUploadRouter tạo mới một instance của UploadRouter
func NewUploadRouter(uploadHandler upload.UploadHandler, fileUploadMiddleware *file_tracking.FileUploadMiddleware) *UploadRouter {
	return &UploadRouter{
		UploadHandler: uploadHandler,
		FileUploadMiddleware: fileUploadMiddleware,
	}
}

// InitRouter khởi tạo các route cho upload
func (r *UploadRouter) InitRouter(router *gin.RouterGroup) {
	// Nhóm các API upload file
	uploadGroup := router.Group("/uploads")
	{
		// API upload file với file tracking middleware
		uploadGroup.POST("", r.FileUploadMiddleware.TrackUpload(), r.UploadHandler.UploadFile)
		
		// API xóa file
		uploadGroup.DELETE("/:public_id", middlewares.JWTAuth(), r.UploadHandler.DeleteFile)
		
		// API đánh dấu file đã sử dụng
		uploadGroup.PUT("/:public_id/mark-used", middlewares.JWTAuth(), r.UploadHandler.MarkFileAsUsed)
	}
}

// UploadRouterGroup nhóm các router liên quan đến upload
var UploadRouterGroup = new(uploadRouterGroup)

type uploadRouterGroup struct{}

// InitUploadRouter khởi tạo các router cho upload
func (u *uploadRouterGroup) InitUploadRouter(router *gin.RouterGroup) {
	uploadHandler := upload.NewUploadHandler(service.Upload())
	
	// Tạo file tracking dependencies
	fileTrackingService := service.FileTracking()
	fileTrackingHelper := file_tracking.NewFileTrackingHelper(fileTrackingService)
	fileUploadMiddleware := file_tracking.NewFileUploadMiddleware(fileTrackingHelper)
	
	uploadRouter := NewUploadRouter(uploadHandler, fileUploadMiddleware)
	uploadRouter.InitRouter(router)
}
