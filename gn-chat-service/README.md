<!--
===== GN FARM CHAT SERVICE - DỲCH VỤ CHAT REAL-TIME =====
Tài liệu này mô tả dịch vụ chat microservice cho ứng dụng GN Farm
Công nghệ sử dụng: Node.js, Express, Socket.IO, MongoDB, PostgreSQL
Chức năng chính:
- Nhắn tin real-time với Socket.IO
- Quản lý cuộc trò chuyện nhóm và cá nhân
- Upload và xử lý file đính kèm (hình ảnh, video, âm thanh)
- Theo dõi trạng thái người dùng online/offline
- Nén và tối ưu hóa file tự động
- Tích hợp AWS S3 cho lưu trữ file
-->

# GN Farm Chat Service

## Tổng quan (Overview)

Dịch vụ chat microservice cho ứng dụng GN Farm được xây dựng bằng Node.js, Express, Socket.IO, MongoDB và PostgreSQL.

## Features

- Real-time messaging using Socket.IO
- Direct and group conversations
- Message status tracking (sent, delivered, read)
- User online/offline status
- File attachments (images, videos, audio, documents)
- Message deletion
- User typing indicators

## Architecture

This service uses:

- **MongoDB** for storing chat messages and conversation metadata
- **PostgreSQL** for user information (shared with the main Go service)
- **Redis** for real-time features (online status, socket connections)
- **Socket.IO** for real-time communication
- **Express.js** for REST API

## Setup

1. Copy the environment variables file:

   ```
   cp .env.example .env
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the service:
   ```
   npm start
   ```

## API Endpoints

### Conversations

- `POST /api/chat/conversations` - Create a new conversation
- `GET /api/chat/conversations` - Get user conversations
- `GET /api/chat/conversations/:conversationId` - Get conversation details
- `POST /api/chat/conversations/:conversationId/users` - Add user to conversation
- `DELETE /api/chat/conversations/:conversationId/users/:userId` - Remove user from conversation

### Messages

- `GET /api/chat/conversations/:conversationId/messages` - Get conversation messages
- `POST /api/chat/conversations/:conversationId/messages` - Send a message
- `POST /api/chat/conversations/:conversationId/messages/with-attachments` - Send a message with file attachments
- `DELETE /api/chat/messages/:messageId` - Delete a message

### Files

- `POST /api/files/upload` - Upload a single file
- `POST /api/files/upload-multiple` - Upload multiple files
- `DELETE /api/files/:filePath` - Delete a file

### Users

- `GET /api/users/:userId` - Get user information
- `GET /api/users/status/:userId` - Get user status
- `GET /api/users/status?userIds=1,2,3` - Get multiple users status
- `GET /api/users?query=search_term` - Search users

## Socket.IO Events

### Client to Server

- `conversation:join` - Join a conversation
- `message:send` - Send a message
- `message:read` - Mark message as read
- `user:typing` - Indicate user is typing

### Server to Client

- `message:new` - New message received
- `message:sent` - Message sent confirmation
- `message:read` - Message read notification
- `user:status` - User status update
- `user:typing` - User typing notification
- `error` - Error notification

## File Attachments

The chat service supports various types of file attachments:

- **Images**: JPEG, PNG, GIF, WebP
- **Videos**: MP4, WebM, QuickTime
- **Audio**: MP3, WAV, OGG
- **Documents**: PDF, Word, Excel, PowerPoint, Text

### AWS S3 Integration

Files are stored in AWS S3 for scalable and reliable storage. The service automatically:

- Uploads files to the configured S3 bucket
- Organizes files by type (images, videos, audio, documents)
- Generates thumbnails for videos using FFmpeg
- Provides secure URLs for accessing the files

### Image Compression

The service automatically compresses images before uploading to S3 to save bandwidth and storage space:

- Resizes large images to a maximum dimension (default: 1920px)
- Compresses JPEG, PNG, and WebP images with configurable quality settings
- Preserves original aspect ratio
- Falls back to original image if compression doesn't reduce file size

### Video Compression

The service automatically compresses videos before uploading to S3:

- Resizes large videos to a maximum width (default: 1280px)
- Reduces bitrate to a configurable maximum (default: 1500kbps)
- Uses H.264 codec for maximum compatibility
- Configurable quality settings via CRF (Constant Rate Factor)
- Preserves original aspect ratio
- Generates thumbnails for video previews
- Falls back to original video if compression doesn't reduce file size

### Configuration

To configure AWS S3, set the following environment variables:

```
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET_NAME=your-bucket-name

# Image Compression Configuration
ENABLE_IMAGE_COMPRESSION=true
IMAGE_MAX_DIMENSION=1920
JPEG_QUALITY=80
PNG_QUALITY=80
WEBP_QUALITY=80

# Video Compression Configuration
ENABLE_VIDEO_COMPRESSION=true
VIDEO_MAX_WIDTH=1280
VIDEO_MAX_BITRATE=1500k
VIDEO_PRESET=medium
VIDEO_CRF=23
VIDEO_MAX_SIZE_MB=50
```

## Client Example

Check the `client-example` directory for example code on how to use the chat service:

- `chat-client.js` - Basic chat client example
- `file-upload-example.js` - Example for uploading files
- `file-upload-example.html` - Complete HTML example for file uploads

## Docker

Build the Docker image:

```
docker build -t gn-chat-service .
```

Run the container:

```
docker run -p 3000:3000 --env-file .env gn-chat-service
```
