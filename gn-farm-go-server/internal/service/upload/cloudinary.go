package upload

import (
	"context"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"path/filepath"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/admin"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/gin-gonic/gin"
)

type CloudinaryService struct {
	cld *cloudinary.Cloudinary
}

// NewCloudinaryService tạo mới một instance của CloudinaryService
func NewCloudinaryService(cfg *UploadConfig) (*CloudinaryService, error) {
	if cfg == nil {
		return nil, fmt.Errorf("cloudinary config is required")
	}

	// Validate required config
	if cfg.CloudName == "" || cfg.APIKey == "" || cfg.APISecret == "" {
		return nil, fmt.Errorf("missing required cloudinary configuration")
	}

	cld, err := cloudinary.NewFromParams(cfg.CloudName, cfg.APIKey, cfg.APISecret)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize Cloudinary: %v", err)
	}

	return &CloudinaryService{cld: cld}, nil
}

func (s *CloudinaryService) UploadImage(c *gin.Context, file *multipart.FileHeader, folder string) (string, error) {
	// Mở file
	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open file: %v", err)
	}
	defer src.Close()

	// Đọc toàn bộ file vào bộ nhớ
	fileBytes, err := io.ReadAll(src)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %v", err)
	}

	// Upload với tag tạm thời
	return s.UploadFile(c.Request.Context(), fileBytes, file.Filename, folder)
}

func (s *CloudinaryService) UploadFile(ctx context.Context, file []byte, filename, folder string) (string, error) {
	// Tạo public ID từ tên file (bỏ đuôi)
	ext := filepath.Ext(filename)
	publicID := filename[:len(filename)-len(ext)]

	// Upload lên Cloudinary với tag tạm thời
	result, err := s.cld.Upload.Upload(
		ctx,
		file,
		uploader.UploadParams{
			Folder:   folder,
			PublicID: publicID,
			Tags:     []string{"temporary"}, // Đánh dấu là file tạm thời
		},
	)
	if err != nil {
		return "", fmt.Errorf("failed to upload file to Cloudinary: %v", err)
	}

	return result.SecureURL, nil
}

func (s *CloudinaryService) DeleteFile(ctx context.Context, publicID string) error {
	invalidate := true
	_, err := s.cld.Upload.Destroy(ctx, uploader.DestroyParams{
		PublicID:   publicID,
		Invalidate: &invalidate, // Xóa cache CDN
	})

	if err != nil {
		return fmt.Errorf("failed to delete file from Cloudinary: %v", err)
	}

	return nil
}

func (s *CloudinaryService) UpdateTags(ctx context.Context, publicID string, tags []string) error {
	_, err := s.cld.Admin.UpdateAsset(ctx, admin.UpdateAssetParams{
		PublicID: publicID,
		Tags:     tags,
	})

	if err != nil {
		return fmt.Errorf("failed to update tags: %v", err)
	}

	return nil
}

func (s *CloudinaryService) CleanupUnusedFiles(ctx context.Context, daysOld int) error {
	// Lấy danh sách các resource có tag "temporary"
	result, err := s.cld.Admin.AssetsByTag(ctx, admin.AssetsByTagParams{
		Tag:        "temporary",
		MaxResults: 100, // Giới hạn số lượng file mỗi lần xử lý
	})

	if err != nil {
		return fmt.Errorf("failed to list resources: %v", err)
	}

	var deleteErrors []error

	// Lặp qua từng resource và kiểm tra thời gian tạo
	for _, asset := range result.Assets {
		// Kiểm tra nếu file đã tồn tại lâu hơn số ngày quy định
		if time.Since(asset.CreatedAt) > time.Duration(daysOld)*24*time.Hour {
			// Xóa file
			if err := s.DeleteFile(ctx, asset.PublicID); err != nil {
				deleteErrors = append(deleteErrors, fmt.Errorf("failed to delete %s: %v", asset.PublicID, err))
			} else {
				log.Printf("Deleted unused file: %s (created at %s)", asset.PublicID, asset.CreatedAt)
			}
		}
	}

	if len(deleteErrors) > 0 {
		return fmt.Errorf("encountered %d errors during cleanup: %v", len(deleteErrors), deleteErrors)
	}

	return nil
}
