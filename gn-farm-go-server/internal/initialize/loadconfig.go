package initialize

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"gn-farm-go-server/global"

	"github.com/spf13/viper"
)

// LoadConfig loads configuration from multiple sources with priority:
// 1. Environment variables (highest priority)
// 2. Config files
// 3. Default values (lowest priority)
func LoadConfig() {
	viper := viper.New()

	// Set default values
	setDefaults(viper)

	// Load from config file
	loadConfigFile(viper)

	// Override with environment variables
	loadEnvironmentVariables(viper)

	// Unmarshal to global config
	if err := viper.Unmarshal(&global.Config); err != nil {
		panic(fmt.Errorf("unable to decode configuration: %w", err))
	}

	// Validate configuration
	validateConfig()

	// Log configuration (without sensitive data)
	logConfiguration()
}

func setDefaults(v *viper.Viper) {
	// Server defaults
	v.SetDefault("server.port", 8002)
	v.SetDefault("server.host", "0.0.0.0")
	v.SetDefault("server.mode", "debug")

	// Database defaults
	v.SetDefault("postgres.host", "localhost")
	v.SetDefault("postgres.port", 5432)
	v.SetDefault("postgres.username", "postgres")
	v.SetDefault("postgres.password", "123456")
	v.SetDefault("postgres.dbname", "GO_GN_FARM")
	v.SetDefault("postgres.sslmode", "disable")

	// Redis defaults
	v.SetDefault("redis.host", "localhost")
	v.SetDefault("redis.port", 6379)
	v.SetDefault("redis.password", "")
	v.SetDefault("redis.db", 0)

	// JWT defaults
	v.SetDefault("jwt.API_SECRET_KEY", "default-jwt-secret-change-in-production")
}

func loadConfigFile(v *viper.Viper) {
	// Determine environment
	env := os.Getenv("GO_ENV")
	if env == "" {
		env = "local"
	}

	// Set config file path and name
	v.AddConfigPath("./config/")
	v.SetConfigName(env)
	v.SetConfigType("yaml")

	// Read configuration file
	if err := v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			fmt.Printf("Config file not found for environment '%s', using defaults and environment variables\n", env)
		} else {
			fmt.Printf("Error reading config file: %v\n", err)
		}
	} else {
		fmt.Printf("Using config file: %s\n", v.ConfigFileUsed())
	}
}

func loadEnvironmentVariables(v *viper.Viper) {
	// Enable automatic environment variable binding
	v.AutomaticEnv()
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	// Manually bind specific environment variables for better control
	envMappings := map[string]string{
		"GO_ENV":                    "server.mode",
		"GO_SERVER_PORT":           "server.port",
		"GO_SERVER_HOST":           "server.host",

		"POSTGRES_HOST":            "postgres.host",
		"POSTGRES_PORT":            "postgres.port",
		"POSTGRES_USER":            "postgres.username",
		"POSTGRES_PASSWORD":        "postgres.password",
		"POSTGRES_DB":              "postgres.dbname",
		"POSTGRES_SSL_MODE":        "postgres.sslmode",

		"REDIS_HOST":               "redis.host",
		"REDIS_PORT":               "redis.port",
		"REDIS_PASSWORD":           "redis.password",
		"REDIS_DB":                 "redis.db",

		"JWT_SECRET":               "jwt.API_SECRET_KEY",

		"SENDGRID_API_KEY":         "email.sendgrid.api_key",
		"SENDER_EMAIL":             "email.sender.email",
	}

	for envVar, configKey := range envMappings {
		if value := os.Getenv(envVar); value != "" {
			// Handle type conversion for specific keys
			switch configKey {
			case "server.port", "postgres.port", "redis.port", "redis.db":
				if intVal, err := strconv.Atoi(value); err == nil {
					v.Set(configKey, intVal)
				}
			default:
				v.Set(configKey, value)
			}
		}
	}
}

func validateConfig() {
	// Validate required configurations
	if global.Config.JWT.API_SECRET_KEY == "default-jwt-secret-change-in-production" {
		fmt.Println("WARNING: Using default JWT secret. Please change it in production!")
	}

	if global.Config.Postgres.Host == "" {
		panic("postgres host is required")
	}

	if global.Config.Postgres.Username == "" {
		panic("postgres username is required")
	}

	if global.Config.Postgres.Dbname == "" {
		panic("postgres database name is required")
	}
}

func logConfiguration() {
	fmt.Println("=== Configuration Loaded ===")
	fmt.Printf("Environment: %s\n", os.Getenv("GO_ENV"))
	fmt.Printf("Server Port: %d\n", global.Config.Server.Port)
	fmt.Printf("Server Mode: %s\n", global.Config.Server.Mode)
	fmt.Printf("Database Host: %s\n", global.Config.Postgres.Host)
	fmt.Printf("Database Name: %s\n", global.Config.Postgres.Dbname)
	fmt.Printf("Redis Host: %s\n", global.Config.Redis.Host)
	fmt.Println("============================")
}
