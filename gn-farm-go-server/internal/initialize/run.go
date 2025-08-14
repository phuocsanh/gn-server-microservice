package initialize

import (
	"context"
	"fmt"
	"time"

	"gn-farm-go-server/global"
	"gn-farm-go-server/internal/config"
	"gn-farm-go-server/internal/database"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func Run() *gin.Engine {
	// load configuration
	LoadConfig()
	m := global.Config.Postgres
	fmt.Println("Loading configuration nysql", m.Username, m.Password)
	InitLogger()
	global.Logger.Info("Config Log ok!!", zap.String("ok", "success"))
	InitPostgres()
	InitPostgresC()
	InitServiceInterface()
	InitProductService()
	InitInventoryService()
	InitRedis()
	InitKafka()

	// Tạo context mới cho toàn bộ vòng đời ứng dụng
	ctx := context.Background()

	// Khởi tạo file tracking service và scheduler
	initFileTracking(ctx)

	r := InitRouter()
	return r
}

func initFileTracking(ctx context.Context) {
	// Lấy cấu hình mặc định
	fileTrackingConfig := config.GetDefaultFileTrackingConfig()
	
	// Cập nhật cấu hình cho việc test
	fileTrackingConfig.Cleanup.Scheduled.Enabled = true
	fileTrackingConfig.Cleanup.Scheduled.Interval = 1 * time.Minute // Chạy mỗi phút để test
	fileTrackingConfig.Cleanup.Temporary.MaxAge = 3 * time.Minute   // Xóa file tạm sau 3 phút
	
	global.Logger.Info("[INIT] File tracking config updated for testing",
		zap.Bool("cleanup_scheduled_enabled", fileTrackingConfig.Cleanup.Scheduled.Enabled),
		zap.Duration("cleanup_interval", fileTrackingConfig.Cleanup.Scheduled.Interval),
		zap.Duration("temp_file_max_age", fileTrackingConfig.Cleanup.Temporary.MaxAge),
	)

	// Khởi tạo dependencies với database connection thực
	global.Logger.Info("[INIT] Setting up file tracking dependencies...")
	db := database.New(global.Pgdbc)
	deps, err := config.SetupFileTrackingDependencies(
		fileTrackingConfig,
		db,            // db
		global.Pgdbc,  // sqlDB
		global.Rdb,    // redisClient
	)
	if err != nil {
		global.Logger.Error("[INIT] Failed to setup file tracking dependencies", zap.Error(err))
		return
	}
	global.Logger.Info("[INIT] File tracking dependencies setup completed",
		zap.Bool("has_cleanup_scheduler", deps.CleanupScheduler != nil),
	)

	// Sử dụng context.Background() để tạo một context mới không bị cancel
	bgCtx := context.Background()
	
	// Khởi động các service trong goroutine riêng
	global.Logger.Info("[INIT] Starting file tracking services in background...")
	go func() {
		global.Logger.Info("[INIT] Inside goroutine - about to start file tracking services")
		if err := config.StartFileTrackingServices(bgCtx, fileTrackingConfig, deps); err != nil {
			global.Logger.Error("[INIT] Failed to start file tracking services", zap.Error(err))
			return
		}
		global.Logger.Info("[INIT] File tracking services started successfully in goroutine")
	}()

	global.Logger.Info("[INIT] File tracking initialization completed", 
		zap.Duration("cleanup_interval", fileTrackingConfig.Cleanup.Scheduled.Interval),
		zap.Duration("temp_file_max_age", fileTrackingConfig.Cleanup.Temporary.MaxAge),
		zap.String("note", "Services are starting in background goroutine"),
	)
}
