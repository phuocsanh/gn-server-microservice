/**
 * #####################################################################
 * JEST TEST SETUP - THIẾT LậP MÔI TRƯỜNG TEST CHO GN CHAT SERVICE
 * File này được chạy trước tất cả tests để thiết lập môi trường
 * 
 * Chức năng chính:
 * - Thiết lập environment variables cho test
 * - Tạo các utility functions dùng chung cho tests
 * - Mock console methods để giảm noise trong test output
 * - Cung cấp helpers tạo mock data
 * 
 * Tác giả: GN Farm Development Team
 * Phiên bản: 1.0
 * #####################################################################
 */

// ===== SETUP GLOBAL TEST ENVIRONMENT =====
// Chạy trước tất cả test suites
beforeAll(async () => {
  // ===== THIẾT LậP ENVIRONMENT VARIABLES CHO TEST =====
  // Cấu hình môi trường test tách biệt với production
  process.env.NODE_ENV = "test"
  process.env.JWT_SECRET = "test-jwt-secret"                    // Secret riêng cho test
  
  // ===== DATABASE TEST CONNECTIONS =====
  // Sử dụng database test riêng để tránh ảnh hưởng dữ liệu thật
  process.env.MONGODB_URI = "mongodb://localhost:27017/gn_chat_test"  // MongoDB test DB
  process.env.POSTGRES_HOST = "localhost"                      // PostgreSQL test connection
  process.env.POSTGRES_PORT = "5432"
  process.env.POSTGRES_USER = "postgres"
  process.env.POSTGRES_PASSWORD = "123456"
  process.env.POSTGRES_DB = "GO_GN_FARM_TEST"                 // Test database
  process.env.REDIS_HOST = "localhost"                        // Redis test connection
  process.env.REDIS_PORT = "6379"
})

afterAll(async () => {
  // ===== DỌN DọP SAU KHI CHẠY TEST =====
  // Thực hiện cleanup nếu cần thiết (close DB connections, clear caches, etc.)
})

// ===== GLOBAL TEST UTILITIES - CÁC HÀM TIỆN ÍCH TEST =====
// Các helper functions được sử dụng chung trong tất cả test files
global.testUtils = {
  // ===== MOCK DATA CREATORS - TẠO DỮU LIỆU GIẢ LẬP =====
  
  // Helper tạo mock user data cho các test cases
  createMockUser: (overrides = {}) => ({
    id: "user123",
    email: "test@example.com",
    name: "Test User",
    ...overrides,                    // Cho phép ghi đè các thuộc tính
  }),

  // Helper tạo mock conversation data
  createMockConversation: (overrides = {}) => ({
    _id: "conversation123",
    participants: ["user1", "user2"],  // Danh sách người tham gia
    type: "direct",                     // Loại cuộc trò chuyện: direct/group
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  // Helper tạo mock message data
  createMockMessage: (overrides = {}) => ({
    _id: "message123",
    conversationId: "conversation123",
    senderId: "user1",                 // ID người gửi
    content: "Test message",            // Nội dung tin nhắn
    messageType: "text",               // Loại: text, image, video, file
    status: "sent",                    // Trạng thái: sent, delivered, read
    createdAt: new Date(),
    ...overrides,
  }),

  // Helper tạo mock JWT token
  createMockToken: () => "mock.jwt.token",

  // ===== ASYNC UTILITIES =====
  // Helper chờ async operations hoàn thành
  wait: (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms)),
}

// Mock console methods in test environment
if (process.env.NODE_ENV === "test") {
  global.console = {
    ...console,
    // Uncomment to suppress console.log in tests
    // log: jest.fn(),
    // info: jest.fn(),
    // warn: jest.fn(),
    error: console.error, // Keep error logs for debugging
  }
}
