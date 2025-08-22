# ===== DOCKERFILE CHO GN-CHAT-SERVICE (NODE.JS) =====
# Container hóa ứng dụng Node.js chat service với các dependencies cần thiết
# Sử dụng Alpine Linux để giảm kích thước image

# Sử dụng Node.js 18 với Alpine Linux (nhẹ và bảo mật)
FROM node:18-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Cài đặt ffmpeg và các công cụ hệ thống cần thiết
# - ffmpeg: Xử lý video/audio trong chat
# - curl: Debug và health check
RUN apk add --no-cache ffmpeg curl

# Copy package.json và package-lock.json trước để tận dụng Docker layer caching
# Nếu dependencies không đổi, layer này sẽ được cache
COPY package*.json ./

# Cài đặt tất cả dependencies từ package.json
RUN npm install
# Cài đặt thêm các packages quan trọng cho chat service:
# - multer: Upload file handling
# - sharp: Image processing và optimization  
# - fluent-ffmpeg: Video/audio processing wrapper
# - aws-sdk: AWS S3 integration cho file storage
# - socket.io-stream: Stream file qua WebSocket
RUN npm install multer sharp fluent-ffmpeg aws-sdk socket.io-stream

# Copy toàn bộ source code vào container
COPY . .

# Tạo thư mục tạm cho việc upload file
# Cần thiết cho việc xử lý file upload trước khi lưu vào S3
RUN mkdir -p /app/temp
# Cấp quyền ghi cho tất cả user (cần thiết cho file uploads)
RUN chmod 777 /app/temp

# Mở port 3000 để ứng dụng có thể nhận requests
EXPOSE 3000

# Lệnh mặc định để chạy ứng dụng production
# Lưu ý: Sẽ bị override bởi docker-compose trong dev mode để chạy nodemon
CMD ["npm", "start"]
