# Database configuration
GOOSE_DBSTRING ?= "postgres://postgres:123456@localhost:5432/GO_GN_FARM?sslmode=disable"
GOOSE_MIGRATION_DIR ?= sql/schema
GOOSE_DRIVER ?= postgres

# App name
APP_NAME = server

# Development commands
dev:
	go run ./cmd/$(APP_NAME)

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

# Testing commands
test:
	GO_ENV=test go test -v ./tests/...

test_coverage:
	GO_ENV=test go test -v -coverprofile=coverage.out ./tests/...
	go tool cover -html=coverage.out -o coverage.html

test_unit:
	GO_ENV=test go test -v ./tests/unit/...

test_integration:
	GO_ENV=test go test -v ./tests/integration/...

test_e2e:
	GO_ENV=test go test -v ./tests/e2e/...

test_all:
	GO_ENV=test go test -v ./tests/unit/... ./tests/integration/... ./tests/e2e/...

# Setup test database
test_db_setup:
	@echo "Setting up test database..."
	@GOOSE_DRIVER=$(GOOSE_DRIVER) GOOSE_DBSTRING="postgres://postgres:123456@localhost:5432/GO_GN_FARM_TEST?sslmode=disable" goose -dir=$(GOOSE_MIGRATION_DIR) up

test_db_reset:
	@echo "Resetting test database..."
	@GOOSE_DRIVER=$(GOOSE_DRIVER) GOOSE_DBSTRING="postgres://postgres:123456@localhost:5432/GO_GN_FARM_TEST?sslmode=disable" goose -dir=$(GOOSE_MIGRATION_DIR) reset
	@GOOSE_DRIVER=$(GOOSE_DRIVER) GOOSE_DBSTRING="postgres://postgres:123456@localhost:5432/GO_GN_FARM_TEST?sslmode=disable" goose -dir=$(GOOSE_MIGRATION_DIR) up

.PHONY: dev docker_up docker_down docker_build migrate_up migrate_down migrate_reset migrate_create sqlgen swag test test_coverage test_unit test_integration test_db_setup test_db_reset