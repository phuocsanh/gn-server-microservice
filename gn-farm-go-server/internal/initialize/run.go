package initialize

import (
	"fmt"

	"gn-farm-go-server/global"

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
	r := InitRouter()
	return r
	// r.Run(":8002")
}
