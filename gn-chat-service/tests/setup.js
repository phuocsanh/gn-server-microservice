// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = "test"
  process.env.JWT_SECRET = "test-jwt-secret"
  process.env.MONGODB_URI = "mongodb://localhost:27017/gn_chat_test"
  process.env.POSTGRES_HOST = "localhost"
  process.env.POSTGRES_PORT = "5432"
  process.env.POSTGRES_USER = "postgres"
  process.env.POSTGRES_PASSWORD = "123456"
  process.env.POSTGRES_DB = "GO_GN_FARM_TEST"
  process.env.REDIS_HOST = "localhost"
  process.env.REDIS_PORT = "6379"
})

afterAll(async () => {
  // Cleanup if needed
})

// Global test utilities
global.testUtils = {
  // Helper to create mock user data
  createMockUser: (overrides = {}) => ({
    id: "user123",
    email: "test@example.com",
    name: "Test User",
    ...overrides,
  }),

  // Helper to create mock conversation data
  createMockConversation: (overrides = {}) => ({
    _id: "conversation123",
    participants: ["user1", "user2"],
    type: "direct",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  // Helper to create mock message data
  createMockMessage: (overrides = {}) => ({
    _id: "message123",
    conversationId: "conversation123",
    senderId: "user1",
    content: "Test message",
    messageType: "text",
    status: "sent",
    createdAt: new Date(),
    ...overrides,
  }),

  // Helper to create mock JWT token
  createMockToken: () => "mock.jwt.token",

  // Helper to wait for async operations
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
