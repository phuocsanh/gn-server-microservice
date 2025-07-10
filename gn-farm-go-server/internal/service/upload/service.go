package upload

import (
	"context"
	"mime/multipart"

	"github.com/gin-gonic/gin"
)

type UploadService interface {
	// UploadImage uploads an image file and returns the URL
	UploadImage(ctx *gin.Context, file *multipart.FileHeader, folder string) (string, error)
	
	// UploadFile uploads a file to cloud storage
	UploadFile(ctx context.Context, file []byte, filename, folder string) (string, error)
	
	// DeleteFile deletes a file from cloud storage
	DeleteFile(ctx context.Context, publicID string) error
	
	// UpdateTags updates tags of a file
	UpdateTags(ctx context.Context, publicID string, tags []string) error
	
	// CleanupUnusedFiles removes temporary files older than specified days
	CleanupUnusedFiles(ctx context.Context, daysOld int) error
}
