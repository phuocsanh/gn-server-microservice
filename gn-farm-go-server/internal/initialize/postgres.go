package initialize

import (
	"fmt"
	"time"

	"gn-farm-go-server/global"
	"gn-farm-go-server/internal/common"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func InitPostgres() {
	p := global.Config.Postgres
	// Build the Data Source Name (DSN)
	dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable TimeZone=Asia/Ho_Chi_Minh",
		p.Host, p.Port, p.Username, p.Password, p.Dbname)
	
	// Open the connection
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		SkipDefaultTransaction: false,
	})
	common.CheckErrorPanic(err, "Failed to initialize PostgreSQL")

	global.Logger.Info("PostgreSQL Initialized Successfully")
	global.Pgdb = db

	// Set connection pool settings
	setPool()
}

// setPool sets the PostgreSQL connection pool settings
func setPool() {
	p := global.Config.Postgres
	sqlDb, err := global.Pgdb.DB()
	common.CheckErrorPanic(err, "Failed to get SQL DB from GORM")

	// Set connection pool configurations
	sqlDb.SetConnMaxIdleTime(time.Duration(p.MaxIdleConns) * time.Second)
	sqlDb.SetMaxOpenConns(p.MaxOpenConns)
	sqlDb.SetConnMaxLifetime(time.Duration(p.ConnMaxLifetime) * time.Second)
} 