package initialize

import (
	"gn-farm-go-server/global"
	"gn-farm-go-server/pkg/logger"
)

func InitLogger() {
	global.Logger = logger.NewLogger(global.Config.Logger)
}
