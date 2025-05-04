package initialize

import (
	"database/sql"
	"fmt"
	"time"

	"gn-farm-go-server/global"
	"gn-farm-go-server/internal/common"

	_ "github.com/lib/pq"
)

func InitPostgresC() {
	p := global.Config.Postgres
	// Build the Data Source Name (DSN)
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%d sslmode=disable TimeZone=Asia/Ho_Chi_Minh",
		p.Host, p.Username, p.Password, p.Dbname, p.Port)
	
	// Open the connection
	db, err := sql.Open("postgres", dsn)
	common.CheckErrorPanic(err, "Failed to initialize PostgreSQL")

	global.Logger.Info("PostgreSQLC Initialized Successfully")
	global.Pgdbc = db

	// Set connection pool settings
	setPoolC()
}

// setPoolC sets the PostgreSQL connection pool settings
func setPoolC() {
	p := global.Config.Postgres
	sqlDb := global.Pgdbc
	
	// Set connection pool configurations
	sqlDb.SetMaxIdleConns(p.MaxIdleConns)
	sqlDb.SetMaxOpenConns(p.MaxOpenConns)
	sqlDb.SetConnMaxLifetime(time.Duration(p.ConnMaxLifetime) * time.Second)
} 