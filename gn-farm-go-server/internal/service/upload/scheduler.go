package upload

import (
	"context"
	"log"

	"github.com/robfig/cron/v3"
)

// StartCleanupScheduler khởi tạo và chạy scheduled job để dọn dẹp file tạm
func StartCleanupScheduler(uploadService UploadService) {
	c := cron.New()
	
	// Chạy vào lúc 2h sáng hàng ngày
	_, err := c.AddFunc("0 2 * * *", func() {
		log.Println("Bắt đầu dọn dẹp file tạm thời...")
		
		// Xóa các file tạm thời cũ hơn 7 ngày
		err := uploadService.CleanupUnusedFiles(context.Background(), 7)
		if err != nil {
			log.Printf("Lỗi khi dọn dẹp file tạm: %v\n", err)
		} else {
			log.Println("Đã hoàn thành dọn dẹp file tạm")
		}
	})

	if err != nil {
		log.Fatalf("Không thể khởi tạo scheduled job: %v", err)
	}

	// Bắt đầu scheduler
	c.Start()
	log.Println("Đã khởi động scheduler dọn dẹp file tạm")
}
