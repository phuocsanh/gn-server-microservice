package global

import (
	"database/sql"

	"gn-farm-go-server/pkg/logger"
	"gn-farm-go-server/pkg/setting"
	"github.com/redis/go-redis/v9"
	"github.com/segmentio/kafka-go"
	"gorm.io/gorm"
)

var (
	Config        setting.Config
	Logger        *logger.LoggerZap
	Rdb           *redis.Client
	Pgdb   	*gorm.DB
	Pgdbc  	*sql.DB
	KafkaProducer *kafka.Writer
)

/*
Config
REdis
Mysql
...
*/
