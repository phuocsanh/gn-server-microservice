FROM node:18-alpine

WORKDIR /app

# Install ffmpeg and other dependencies
RUN apk add --no-cache ffmpeg

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install
RUN npm install multer sharp fluent-ffmpeg aws-sdk socket.io-stream

# Copy source code
COPY . .

# Create temp directory for file uploads
RUN mkdir -p /app/temp
RUN chmod 777 /app/temp

# Expose port
EXPOSE 3000

# Start the application (will be overridden by docker-compose command for dev mode)
CMD ["npm", "start"]
