const { createServer } = require("http")
const { Server } = require("socket.io")
const Client = require("socket.io-client")
const jwt = require("jsonwebtoken")
const socketHandler = require("../../src/socket/socketHandler")
const redis = require("../../src/config/redis")
const { getUserInfo } = require("../../src/services/user.service")
const Message = require("../../src/models/message.model")
const Conversation = require("../../src/models/conversation.model")

// Mock Redis client with improved functionality
const mockRedisClient = {
  set: jest.fn().mockResolvedValue("OK"),
  get: jest.fn().mockImplementation((key) => {
    if (key === "user:1:status") return Promise.resolve("online")
    if (key === "user:1:lastActive")
      return Promise.resolve(Date.now().toString())
    return Promise.resolve(null)
  }),
  del: jest.fn().mockResolvedValue(1),
  multi: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([]),
  isOpen: true,
}

// Mock user service
jest.mock("../../src/services/user.service", () => ({
  getUserInfo: jest.fn().mockResolvedValue({
    user_id: 1,
    user_account: "testuser",
    user_nickname: "Test User",
    user_avatar: "avatar.jpg",
    user_state: "active",
  }),
}))

// Mock models
jest.mock("../../src/models/conversation.model", () => ({
  find: jest.fn().mockResolvedValue([
    {
      _id: "conv1",
      conversationId: "conv1",
      participants: [{ userId: 1, role: "admin" }],
      isActive: true,
    },
  ]),
  findOne: jest.fn().mockResolvedValue({
    _id: "conv1",
    conversationId: "conv1",
    participants: [{ userId: 1, role: "admin" }],
    isActive: true,
    save: jest.fn().mockResolvedValue(true),
  }),
}))

jest.mock("../../src/models/message.model", () => {
  const mockMessageInstance = {
    _id: "msg1",
    save: jest.fn().mockResolvedValue(true),
    createdAt: new Date(),
  }

  return jest.fn().mockImplementation(() => mockMessageInstance)
})

// Mock Redis
jest.mock("../../src/config/redis", () => ({
  getRedisClient: jest.fn().mockReturnValue(mockRedisClient),
  isRedisConnected: jest.fn().mockReturnValue(true),
  closeRedisConnection: jest.fn().mockResolvedValue(undefined),
}))

// Set JWT secret for testing
process.env.JWT_SECRET = "test_secret"

describe("Socket Handler", () => {
  let io, serverSocket, clientSocket, httpServer

  beforeAll((done) => {
    httpServer = createServer()
    io = new Server(httpServer)
    httpServer.listen(() => {
      const port = httpServer.address().port

      // Create client with valid JWT token
      const token = jwt.sign({ user_id: 1 }, process.env.JWT_SECRET)
      clientSocket = new Client(`http://localhost:${port}`, {
        auth: {
          token: token,
        },
      })

      io.on("connection", (socket) => {
        serverSocket = socket
        socketHandler(socket, io)
      })

      clientSocket.on("connect", done)
    })
  })

  afterAll(() => {
    io.close()
    clientSocket.close()
    httpServer.close()
    jest.clearAllMocks()
  })

  test("should update user status in Redis when connected", () => {
    expect(mockRedisClient.set).toHaveBeenCalledWith("user:1:status", "online")
    expect(mockRedisClient.set).toHaveBeenCalledWith(
      expect.stringMatching(/user:1:socketId/),
      expect.any(String)
    )
    expect(mockRedisClient.set).toHaveBeenCalledWith(
      expect.stringMatching(/user:1:lastActive/),
      expect.any(String)
    )
  })

  test("should join user to their conversation rooms", () => {
    expect(Conversation.find).toHaveBeenCalledWith({
      "participants.userId": 1,
      isActive: true,
    })
  })

  test("should handle conversation:join event", (done) => {
    // Setup event listener for response
    clientSocket.on("conversation:joined", (data) => {
      expect(data).toEqual({ conversationId: "test-conv" })
      done()
    })

    // Emit event
    clientSocket.emit("conversation:join", { conversationId: "test-conv" })
  })

  test("should handle message:send event", (done) => {
    // Setup event listener for response
    clientSocket.on("message:sent", (data) => {
      expect(data).toHaveProperty("messageId")
      expect(data).toHaveProperty("conversationId", "test-conv")
      expect(data).toHaveProperty("content", "Hello world")
      done()
    })

    // Emit event
    clientSocket.emit("message:send", {
      conversationId: "test-conv",
      content: "Hello world",
    })
  })

  test("should handle message:read event", () => {
    // Emit event
    clientSocket.emit("message:read", {
      conversationId: "test-conv",
      messageId: "msg1",
    })

    // Check if Message.updateOne was called
    expect(Message.updateOne).toHaveBeenCalled()
  })

  test("should handle user:typing event", (done) => {
    // Setup spy on socket.to().emit()
    const toSpy = jest.spyOn(serverSocket, "to").mockReturnValue({
      emit: (event, data) => {
        expect(event).toBe("user:typing")
        expect(data).toHaveProperty("conversationId", "test-conv")
        expect(data).toHaveProperty("userId", 1)
        expect(data).toHaveProperty("isTyping", true)
        done()
      },
    })

    // Emit event
    clientSocket.emit("user:typing", {
      conversationId: "test-conv",
      isTyping: true,
    })

    // Clean up
    toSpy.mockRestore()
  })

  test("should update user status in Redis when disconnected", () => {
    // Simulate disconnect
    serverSocket.disconnect()

    // Check Redis calls
    expect(mockRedisClient.set).toHaveBeenCalledWith("user:1:status", "offline")
    expect(mockRedisClient.set).toHaveBeenCalledWith(
      expect.stringMatching(/user:1:lastSeen/),
      expect.any(String)
    )
    expect(mockRedisClient.del).toHaveBeenCalledWith(
      expect.stringMatching(/user:1:socketId/)
    )
  })

  test("should use cached user info for subsequent connections", async () => {
    // Reset mocks
    jest.clearAllMocks()

    // Create a new connection with valid JWT token
    const token = jwt.sign({ user_id: 1 }, process.env.JWT_SECRET)
    const newClientSocket = new Client(
      `http://localhost:${httpServer.address().port}`,
      {
        auth: {
          token: token,
        },
      }
    )

    // Wait for connection
    await new Promise((resolve) => {
      newClientSocket.on("connect", resolve)
    })

    // The first connection should call getUserInfo
    expect(getUserInfo).toHaveBeenCalledTimes(1)

    // Close the connection
    newClientSocket.close()
  })

  test("should handle Redis errors gracefully", async () => {
    // Mock Redis error
    const originalSet = mockRedisClient.set
    mockRedisClient.set = jest
      .fn()
      .mockRejectedValue(new Error("Redis connection error"))

    // Create a new connection with valid JWT token
    const token = jwt.sign({ user_id: 1 }, process.env.JWT_SECRET)
    const errorClientSocket = new Client(
      `http://localhost:${httpServer.address().port}`,
      {
        auth: {
          token: token,
        },
      }
    )

    // Wait for connection
    await new Promise((resolve) => {
      errorClientSocket.on("connect", resolve)
    })

    // Connection should succeed despite Redis error
    expect(errorClientSocket.connected).toBe(true)

    // Restore original mock
    mockRedisClient.set = originalSet

    // Close the connection
    errorClientSocket.close()
  })

  test("should reject connection with invalid JWT token", (done) => {
    // Create client with invalid token
    const invalidClientSocket = new Client(
      `http://localhost:${httpServer.address().port}`,
      {
        auth: {
          token: "invalid_token",
        },
      }
    )

    // Should receive error event
    invalidClientSocket.on("error", (error) => {
      expect(error).toBeDefined()
      expect(error.message).toContain("Invalid authentication token")
      invalidClientSocket.close()
      done()
    })
  })

  test("should reject connection with missing token", (done) => {
    // Create client without token
    const noTokenClientSocket = new Client(
      `http://localhost:${httpServer.address().port}`,
      {
        // No auth object
      }
    )

    // Should receive error event
    noTokenClientSocket.on("error", (error) => {
      expect(error).toBeDefined()
      expect(error.message).toContain("Authentication token is missing")
      noTokenClientSocket.close()
      done()
    })
  })
})
