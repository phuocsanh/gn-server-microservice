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

# Help command
help:
	@echo "Available commands:"
	@echo "  dev              - Start all services in development mode with hot reloading"
	@echo "  start            - Start all services (builds containers and runs migrations)"
	@echo "  stop             - Stop all services"
	@echo "  restart          - Restart all services"
	@echo "  status           - Show status of all services"
	@echo "  docker_up        - Start all containers"
	@echo "  docker_down      - Stop and remove all containers"
	@echo "  docker_build     - Build and start all containers"
	@echo "  docker_logs      - View logs from all containers"
	@echo "  logs_go          - View logs from Go server only"
	@echo "  logs_chat        - View logs from Chat service only"
	@echo "  docker_restart   - Restart all containers"
	@echo "  go_dev           - Run Go server in development mode (local)"
	@echo "  chat_dev         - Run Chat service in development mode (local)"

.PHONY: docker_up docker_down docker_build docker_logs docker_restart go_dev chat_dev dev start stop restart status logs_go logs_chat help
