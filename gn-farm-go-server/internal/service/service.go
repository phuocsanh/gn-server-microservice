package service

import (
	"gn-farm-go-server/internal/service/upload"
)

var (
	// uploadService quản lý việc upload file
	uploadService upload.UploadService
)

// SetUploadService thiết lập upload service
func SetUploadService(service upload.UploadService) {
	uploadService = service
}

// Upload trả về instance của UploadService
func Upload() upload.UploadService {
	return uploadService
}
