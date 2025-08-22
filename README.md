<!--
===== GN FARM MICROSERVICES - TÀI LIỆU DỰ ÁN =====
Tài liệu này cung cấp hướng dẫn đầy đủ về hệ thống microservices GN Farm
Bao gồm các chức năng:
- Quản lý sản phẩm và kho hàng (Go server)
- Hệ thống chat real-time (Node.js service)
- Cơ sở dữ liệu đa dạng (PostgreSQL, MongoDB, Redis)
- Container hóa với Docker và Docker Compose
-->

# GN Farm Microservices

Hệ thống microservices cho GN Farm bao gồm:

- **gn-farm-go-server**: Backend Go cho quản lý người dùng và sản phẩm
- **gn-chat-service**: Dịch vụ chat real-time bằng Node.js

## Cấu trúc dự án

```
/gn-server-microservice
  /gn-farm-go-server     # Backend Go
  /gn-chat-service       # Dịch vụ chat Node.js
  docker-compose.yaml    # File Docker Compose chung
  Makefile               # Makefile chung
  README.md              # Tài liệu dự án
```

## Yêu cầu hệ thống

- Docker và Docker Compose
- Go 1.19+
- Node.js 18+
- PostgreSQL 15
- MongoDB 6.0
- Redis 7.4

## Khởi động hệ thống

### Sử dụng Docker Compose

Khởi động tất cả các dịch vụ:

```bash
make docker_up
```

Hoặc với việc build lại các image:

```bash
make docker_build
```

### Chạy trong chế độ phát triển

Khởi động các dịch vụ cơ sở dữ liệu và chạy Go server trong chế độ phát triển:

```bash
make dev
```

Chạy dịch vụ chat trong chế độ phát triển:

```bash
make chat_dev
```

## Quản lý cơ sở dữ liệu

### Chạy migrations

```bash
make migrate_up
```

### Tạo migration mới

```bash
make migrate_create name=new_migration
```

## Các dịch vụ

### Go Server (gn-farm-go-server)

- **Port**: 8002
- **Endpoint**: http://localhost:8002
- **Swagger**: http://localhost:8002/swagger/index.html

### Chat Service (gn-chat-service)

- **Port**: 3000
- **API Endpoint**: http://localhost:3000/api
- **Socket.IO**: http://localhost:3000

### PostgreSQL

- **Port**: 5432
- **User**: postgres
- **Password**: 123456
- **Database**: GO_GN_FARM

### MongoDB

- **Port**: 27017
- **Database**: gn_chat

### Redis

- **Port**: 6381 (mapped to 6379 inside container)

### Kafka

- **Broker Port**: 9092
- **UI**: http://localhost:8080

## Tài liệu API

### Go Server API

Xem tài liệu Swagger tại http://localhost:8002/swagger/index.html

### Chat Service API

#### Conversations

- `POST /api/chat/conversations` - Tạo cuộc trò chuyện mới
- `GET /api/chat/conversations` - Lấy danh sách cuộc trò chuyện
- `GET /api/chat/conversations/:conversationId` - Lấy chi tiết cuộc trò chuyện
- `POST /api/chat/conversations/:conversationId/users` - Thêm người dùng vào cuộc trò chuyện
- `DELETE /api/chat/conversations/:conversationId/users/:userId` - Xóa người dùng khỏi cuộc trò chuyện

#### Messages

- `GET /api/chat/conversations/:conversationId/messages` - Lấy tin nhắn của cuộc trò chuyện
- `POST /api/chat/conversations/:conversationId/messages` - Gửi tin nhắn
- `DELETE /api/chat/messages/:messageId` - Xóa tin nhắn

#### Users

- `GET /api/users/:userId` - Lấy thông tin người dùng
- `GET /api/users/status/:userId` - Lấy trạng thái người dùng
- `GET /api/users/status?userIds=1,2,3` - Lấy trạng thái nhiều người dùng
- `GET /api/users?query=search_term` - Tìm kiếm người dùng

## Socket.IO Events

### Client to Server

- `conversation:join` - Tham gia cuộc trò chuyện
- `message:send` - Gửi tin nhắn
- `message:read` - Đánh dấu tin nhắn đã đọc
- `user:typing` - Chỉ báo người dùng đang nhập

### Server to Client

- `message:new` - Tin nhắn mới
- `message:sent` - Xác nhận tin nhắn đã gửi
- `message:read` - Thông báo tin nhắn đã đọc
- `user:status` - Cập nhật trạng thái người dùng
- `user:typing` - Thông báo người dùng đang nhập
- `error` - Thông báo lỗi

## Lệnh hữu ích

Xem tất cả các lệnh có sẵn:

```bash
make help
```
