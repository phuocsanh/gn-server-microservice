# Development Guide - HƯỚNG DẪN PHÁT TRIỂN

```
#####################################################################
HƯỚNG DẪN PHÁT TRIỂN CHO GN FARM MICROSERVICES
Tài liệu này hướng dẫn developers thiết lập và phát triển hệ thống

Nội dung bao gồm:
- Cài đặt và khởi động nhanh (Quick Start)
- Kiến trúc hệ thống (Architecture Overview) 
- Quy trình testing và debugging
- Development workflow và best practices
- Cấu trúc project và coding standards

Tác giả: GN Farm Development Team
Phiên bản: 1.0
#####################################################################
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Go 1.22+ (for local development)
- Node.js 18+ (for local development)
- PostgreSQL (for local development)
- Redis (for local development)
- MongoDB (for local development)

### Start All Services
```bash
# Development mode with hot reloading
make dev

# Production mode
make start

# Stop all services
make stop
```

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐
│   Go Server     │    │  Chat Service   │
│   (Port 8002)   │    │   (Port 3000)   │
│                 │    │                 │
│ • User API      │    │ • Real-time     │
│ • Product API   │    │   Chat          │
│ • Auth          │    │ • File Upload   │
│ • Swagger       │    │ • Socket.IO     │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
┌───▼───┐    ┌──────▼──────┐    ┌────▼────┐
│ Redis │    │ PostgreSQL  │    │ MongoDB │
│       │    │             │    │         │
│ Cache │    │ Users       │    │ Chat    │
│ Session│    │ Products    │    │ Messages│
└───────┘    └─────────────┘    └─────────┘
```

## 🧪 Testing

### Go Server Testing
```bash
cd gn-farm-go-server

# Setup test database
make test_db_setup

# Run all tests
make test

# Run specific test types
make test_unit          # Unit tests
make test_integration   # Integration tests
make test_e2e          # End-to-end tests

# Coverage report
make test_coverage
```

### Chat Service Testing
```bash
cd gn-chat-service

# Install dependencies
npm install

# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration

# Coverage report
npm run test:coverage

# Watch mode
npm run test:watch
```

### Run All Tests
```bash
# From root directory
make test_all
make test_coverage
```

## 📊 Health Checks

### Endpoints
- **Go Server**: 
  - Health: `http://localhost:8002/health`
  - Ready: `http://localhost:8002/ready`
  - Live: `http://localhost:8002/live`

- **Chat Service**:
  - Health: `http://localhost:3000/health`
  - Ready: `http://localhost:3000/ready`
  - Live: `http://localhost:3000/live`

### Docker Health Checks
```bash
# Check service health
docker compose ps

# View health check logs
docker logs backend_go_gn_farm
docker logs chat_service_gn_farm
```

## 🔧 Development Workflow

### 1. Code Changes
- **Go Server**: Hot reloading with Air
- **Chat Service**: Hot reloading with Nodemon
- Changes are automatically detected and applied

### 2. Database Changes
```bash
cd gn-farm-go-server

# Create new migration
make migrate_create name=add_new_table

# Apply migrations
make migrate_up

# Rollback migrations
make migrate_down

# Generate Go code from SQL
make sqlgen
```

### 3. API Documentation
```bash
cd gn-farm-go-server

# Generate Swagger docs
make swag

# View docs at: http://localhost:8002/swagger/index.html
```

## 🐛 Debugging

### View Logs
```bash
# All services
make docker_logs

# Specific services
make logs_go
make logs_chat

# Follow logs
docker logs -f backend_go_gn_farm
docker logs -f chat_service_gn_farm
```

### Debug Mode
```bash
# Go server debug mode
cd gn-farm-go-server
GIN_MODE=debug make dev

# Chat service debug mode
cd gn-chat-service
DEBUG=* npm run dev
```

## 📁 Project Structure

### Go Server
```
gn-farm-go-server/
├── cmd/server/          # Application entry point
├── internal/
│   ├── controller/      # HTTP handlers
│   ├── service/         # Business logic
│   ├── database/        # Generated database code
│   ├── middlewares/     # HTTP middlewares
│   └── initialize/      # App initialization
├── tests/
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── e2e/           # End-to-end tests
├── sql/
│   ├── schema/        # Database migrations
│   └── queries/       # SQL queries
└── config/            # Configuration files
```

### Chat Service
```
gn-chat-service/
├── src/
│   ├── controllers/    # HTTP handlers
│   ├── services/      # Business logic
│   ├── models/        # Database models
│   ├── routes/        # Route definitions
│   ├── middlewares/   # HTTP middlewares
│   ├── socket/        # Socket.IO handlers
│   └── config/        # Configuration
├── tests/
│   ├── unit/         # Unit tests
│   └── integration/  # Integration tests
└── uploads/          # File uploads
```

## 🔐 Environment Variables

### Go Server (.env)
```bash
# Database
DB_HOST=postgres_gn_farm
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=GO_GN_FARM

# Redis
REDIS_HOST=redis_gn_farm
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret

# Email
SENDGRID_API_KEY=your_sendgrid_key
SENDER_EMAIL=your_email@example.com
```

### Chat Service (.env)
```bash
# Server
PORT=3000
NODE_ENV=development

# Databases
MONGODB_URI=mongodb://mongo_gn_farm:27017/gn_chat
POSTGRES_HOST=postgres_gn_farm
REDIS_HOST=redis_gn_farm

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET_NAME=your-bucket

# JWT
JWT_SECRET=your_jwt_secret
```

## 🚀 Deployment

### Development
```bash
make dev
```

### Production
```bash
make start
```

### Individual Services
```bash
# Go server only
make go_dev

# Chat service only
make chat_dev
```

## 📈 Performance Monitoring

### Metrics Endpoints
- Go Server: `/health` - includes response times and connection stats
- Chat Service: `/health` - includes database and Redis stats

### Log Analysis
- Structured JSON logs
- Request/Response logging
- Error tracking with stack traces
- Performance metrics

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          make test_all
```

## 🆘 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using ports
   lsof -i :8002
   lsof -i :3000
   ```

2. **Database connection issues**
   ```bash
   # Check database health
   curl http://localhost:8002/health
   curl http://localhost:3000/health
   ```

3. **Hot reloading not working**
   ```bash
   # Restart services
   make restart
   ```

4. **Test database issues**
   ```bash
   # Reset test database
   cd gn-farm-go-server
   make test_db_reset
   ```

### Getting Help
- Check logs: `make docker_logs`
- Check health: `curl http://localhost:8002/health`
- Run tests: `make test_all`
- Reset everything: `make stop && make start`
