#####################################################################
# MAKEFILE CHO GN FARM MICROSERVICES - BUILD & DEVELOPMENT AUTOMATION
# File này chứa tất cả commands để phát triển và vận hành microservices
#
# Mục đích:
# - Tự động hóa quy trình development với hot reloading
# - Quản lý Docker containers cho all services
# - Build, test, và deploy toàn bộ hệ thống
# - Cung cấp shortcuts cho common tasks
#
# Services được quản lý:
# - Go Backend Server (port 8002)
# - Node.js Chat Service (port 3000) 
# - PostgreSQL Database (port 5432)
# - MongoDB (port 27017)
# - Redis Cache (port 6381)
# - Kafka + Zookeeper (ports 9092, 2181)
# - Kafka UI (port 8080)
#
# Cách sử dụng: make <command>
# Ví dụ: make dev, make start, make help
#
# Tác giả: GN Farm Development Team
# Phiên bản: 1.0
#####################################################################

# Makefile for GN Farm Microservices

# ===== DOCKER COMMANDS - LỆNH QUẢN LÝ CONTAINERS =====
# Các lệnh cơ bản để quản lý Docker containers
docker_up:
	# Khởi động tất cả containers trong chế độ detached
	docker compose up -d

docker_down:
	# Dừng và xóa tất cả containers
	docker compose down

docker_build:
	# Build lại images và khởi động containers
	docker compose up -d --build

docker_logs:
	# Xem logs từ tất cả containers theo thời gian thực
	docker compose logs -f

docker_restart:
	# Restart tất cả containers đang chạy
	docker compose restart

# ===== INDIVIDUAL SERVICE COMMANDS - LỆNH CHO TỬNG SERVICE =====
# Các lệnh chạy riêng lẻ từng service cho development

# Go server commands
go_dev:
	# Chạy Go server ở chế độ development với hot reload
	cd gn-farm-go-server && make dev

# Chat service commands  
chat_dev:
	# Chạy Node.js chat service với nodemon hot reload
	cd gn-chat-service && npm run dev

chat_test:
	# Chạy Jest tests cho chat service
	cd gn-chat-service && npm test

chat_test_coverage:
	# Chạy tests với báo cáo coverage cho chat service
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
