#!/bin/sh

# Chạy swag init để tạo tài liệu Swagger
echo "Running swag init..."

# Tìm đường dẫn đến swag
SWAG_PATH=$(find /go -name swag -type f | head -n 1)
echo "Swag path: $SWAG_PATH"

if [ -n "$SWAG_PATH" ]; then
    echo "Running $SWAG_PATH init -g ./cmd/server/main.go -o ./cmd/swag/docs"
    $SWAG_PATH init -g ./cmd/server/main.go -o ./cmd/swag/docs
else
    echo "Swag not found"
fi

# Khởi động ứng dụng với Air
echo "Starting application with Air..."
/go/bin/air -c .air.toml
