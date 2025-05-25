# Makefile for GN Farm Microservices

# Docker commands
docker_up:
	docker compose up -d

docker_down:
	docker compose down

docker_build:
	docker compose up -d --build

docker_logs:
	docker compose logs -f

docker_restart:
	docker compose restart

# Go server commands
go_dev:
	cd gn-farm-go-server && make dev

# Chat service commands
chat_dev:
	cd gn-chat-service && npm run dev

chat_test:
	cd gn-chat-service && npm test

chat_test_coverage:
	cd gn-chat-service && npm run test:coverage

# Start all services in development mode with hot reloading
dev:
	@echo "Starting all services in development mode with hot reloading..."
	@echo "Building and starting containers..."
	docker compose up -d --build
	@echo "All services started successfully with hot reloading enabled!"
	@echo "Go server running at: http://localhost:8002 (with hot reloading)"
	@echo "Chat service running at: http://localhost:3000 (with hot reloading)"
	@echo "MongoDB running at: mongodb://localhost:27017"
	@echo "PostgreSQL running at: localhost:5432"
	@echo "Redis running at: localhost:6381"
	@echo "Kafka UI running at: http://localhost:8080"
	@echo ""
	@echo "Your code changes will be automatically detected and applied."
	@echo "To view logs, run: make docker_logs"

# Start all services in production mode
start:
	@echo "Starting all services..."
	@echo "Building and starting containers..."
	docker compose up -d --build
	@echo "Running database migrations..."
	cd gn-farm-go-server && make migrate_up
	@echo "All services started successfully!"
	@echo "Go server running at: http://localhost:8002"
	@echo "Chat service running at: http://localhost:3000"
	@echo "MongoDB running at: mongodb://localhost:27017"
	@echo "PostgreSQL running at: localhost:5432"
	@echo "Redis running at: localhost:6381"
	@echo "Kafka UI running at: http://localhost:8080"

# Stop all services
stop:
	@echo "Stopping all services..."
	docker compose down
	@echo "All services stopped successfully!"

# Restart all services
restart: stop start

# Show status of all services
status:
	docker compose ps

# View logs for specific services
logs_go:
	docker logs -f backend_go_gn_farm

logs_chat:
	docker logs -f chat_service_gn_farm

# Build commands
build:
	@echo "Building all services..."
	cd gn-farm-go-server && go build -o bin/server cmd/server/main.go
	cd gn-chat-service && npm run build
	@echo "All services built successfully!"

build_go:
	@echo "Building Go server..."
	cd gn-farm-go-server && go build -o bin/server cmd/server/main.go
	@echo "Go server built successfully!"

build_chat:
	@echo "Building Chat service..."
	cd gn-chat-service && npm run build
	@echo "Chat service built successfully!"

# Testing commands
test_go:
	cd gn-farm-go-server && make test

test_chat:
	cd gn-chat-service && npm test

test_all:
	@echo "Running all tests..."
	cd gn-farm-go-server && make test
	cd gn-chat-service && npm test

test_coverage:
	@echo "Running tests with coverage..."
	cd gn-farm-go-server && make test_coverage
	cd gn-chat-service && npm run test:coverage

# Help command
help:
	@echo "🚀 GN Farm Microservices - Available Commands"
	@echo ""
	@echo "📦 Service Management:"
	@echo "  dev              - Start all services in development mode with hot reloading"
	@echo "  start            - Start all services (builds containers and runs migrations)"
	@echo "  stop             - Stop all services"
	@echo "  restart          - Restart all services"
	@echo "  status           - Show status of all services"
	@echo ""
	@echo "🐳 Docker Commands:"
	@echo "  docker_up        - Start all containers"
	@echo "  docker_down      - Stop and remove all containers"
	@echo "  docker_build     - Build and start all containers"
	@echo "  docker_logs      - View logs from all containers"
	@echo "  docker_restart   - Restart all containers"
	@echo ""
	@echo "📋 Logs:"
	@echo "  logs_go          - View logs from Go server only"
	@echo "  logs_chat        - View logs from Chat service only"
	@echo ""
	@echo "🔨 Build Commands:"
	@echo "  build            - Build all services"
	@echo "  build_go         - Build Go server only"
	@echo "  build_chat       - Build Chat service only"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  test_go          - Run Go server tests"
	@echo "  test_chat        - Run Chat service tests"
	@echo "  test_all         - Run all tests"
	@echo "  test_coverage    - Run tests with coverage"
	@echo ""
	@echo "🔧 Development:"
	@echo "  go_dev           - Run Go server in development mode (local)"
	@echo "  chat_dev         - Run Chat service in development mode (local)"
	@echo "  chat_test        - Run Chat service tests"
	@echo "  chat_test_coverage - Run Chat service tests with coverage"
	@echo ""
	@echo "📊 Health Checks:"
	@echo "  Go Server:       http://localhost:8002/health"
	@echo "  Chat Service:    http://localhost:3000/health"
	@echo "  Swagger Docs:    http://localhost:8002/swagger/index.html"
	@echo ""
	@echo "📖 Documentation: See DEVELOPMENT.md for detailed guide"

.PHONY: docker_up docker_down docker_build docker_logs docker_restart go_dev chat_dev dev start stop restart status logs_go logs_chat build build_go build_chat test_go test_chat test_all test_coverage help
