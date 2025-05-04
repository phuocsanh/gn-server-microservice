package initialize

import (
	"gn-farm-go-server/global"
	"gn-farm-go-server/internal/database"
	"gn-farm-go-server/internal/service"
	"gn-farm-go-server/internal/service/impl"
)

func InitServiceInterface() {
	queries := database.New(global.Pgdbc)
	// User Service Interface
	service.InitUserLogin(impl.NewUserLoginImpl(queries))
	//...
}
