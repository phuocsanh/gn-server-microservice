#!/bin/bash

# Kiểm tra xem Swagger UI có hoạt động không
echo "Kiểm tra Swagger UI..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:8002/swagger/index.html
echo ""

# Kiểm tra xem tài liệu Swagger có tồn tại không
echo "Kiểm tra tài liệu Swagger..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:8002/swagger/doc.json
echo ""

# Kiểm tra xem container backend_go_gn_farm có đang chạy không
echo "Kiểm tra container backend_go_gn_farm..."
docker ps | grep backend_go_gn_farm

# Kiểm tra logs của container backend_go_gn_farm
echo "Kiểm tra logs của container backend_go_gn_farm..."
docker logs backend_go_gn_farm | grep swagger
