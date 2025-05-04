# Database configuration
GOOSE_DBSTRING ?= "postgres://postgres:123456@localhost:5432/GO_GN_FARM?sslmode=disable"
GOOSE_MIGRATION_DIR ?= sql/schema
GOOSE_DRIVER ?= postgres

# App name
APP_NAME = server

# Development commands
dev:
	go run ./cmd/$(APP_NAME)

# Docker commands
docker_up:
	docker compose up -d

docker_down:
	docker compose down

docker_build:
	docker compose up -d --build

# Database migration commands
migrate_up:
	@GOOSE_DRIVER=$(GOOSE_DRIVER) GOOSE_DBSTRING=$(GOOSE_DBSTRING) goose -dir=$(GOOSE_MIGRATION_DIR) up

migrate_down:
	@GOOSE_DRIVER=$(GOOSE_DRIVER) GOOSE_DBSTRING=$(GOOSE_DBSTRING) goose -dir=$(GOOSE_MIGRATION_DIR) down

migrate_reset:
	@GOOSE_DRIVER=$(GOOSE_DRIVER) GOOSE_DBSTRING=$(GOOSE_DBSTRING) goose -dir=$(GOOSE_MIGRATION_DIR) reset

migrate_create:
	@goose -dir=$(GOOSE_MIGRATION_DIR) create $(name) sql

# Generate SQL code
sqlgen:
	sqlc generate

# Generate Swagger docs
swag:
	swag init -g ./cmd/server/main.go -o ./cmd/swag/docs

.PHONY: dev docker_up docker_down docker_build migrate_up migrate_down migrate_reset migrate_create sqlgen swag