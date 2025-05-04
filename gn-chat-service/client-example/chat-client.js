// Example client-side code for integrating with the chat service
// This can be used in your frontend application

class GNChatClient {
  constructor(apiUrl, socketUrl, authToken) {
    this.apiUrl = apiUrl;
    this.socketUrl = socketUrl;
    this.authToken = authToken;
    this.socket = null;
    this.conversations = [];
    this.currentConversation = null;
    this.handlers = {
      onMessage: () => {},
      onConversationJoined: () => {},
      onMessageSent: () => {},
      onMessageRead: () => {},
      onUserTyping: () => {},
      onUserStatus: () => {},
      onError: () => {}
    };
  }

  // Initialize the chat client
  async init() {
    try {
      // Load the socket.io client library
      if (!window.io) {
        console.error('Socket.IO client not found. Please include socket.io-client in your project.');
        return false;
      }

      // Connect to socket server
      this.socket = window.io(this.socketUrl, {
        auth: {
          token: this.authToken
        }
      });

      // Set up event listeners
      this.setupSocketListeners();

      // Load initial conversations
      await this.loadConversations();

      return true;
    } catch (error) {
      console.error('Failed to initialize chat client:', error);
      return false;
    }
  }

  // Set up socket event listeners
  setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });

    this.socket.on('message:new', (message) => {
      this.handlers.onMessage(message);
    });

    this.socket.on('conversation:joined', (data) => {
      this.handlers.onConversationJoined(data);
    });

    this.socket.on('message:sent', (message) => {
      this.handlers.onMessageSent(message);
    });

    this.socket.on('message:read', (data) => {
      this.handlers.onMessageRead(data);
    });

    this.socket.on('user:typing', (data) => {
      this.handlers.onUserTyping(data);
    });

    this.socket.on('user:status', (data) => {
      this.handlers.onUserStatus(data);
    });

    this.socket.on('error', (error) => {
      this.handlers.onError(error);
    });
  }

  // Register event handlers
  on(event, handler) {
    if (this.handlers.hasOwnProperty(event)) {
      this.handlers[event] = handler;
    }
  }

  // Load user conversations
  async loadConversations() {
    try {
      const response = await fetch(`${this.apiUrl}/chat/conversations`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load conversations');
      }

      const data = await response.json();
      this.conversations = data.data;
      return this.conversations;
    } catch (error) {
      console.error('Error loading conversations:', error);
      throw error;
    }
  }

  // Join a conversation
  joinConversation(conversationId) {
    this.currentConversation = conversationId;
    this.socket.emit('conversation:join', { conversationId });
  }

  // Send a message
  sendMessage(content, attachments = []) {
    if (!this.currentConversation) {
      throw new Error('No active conversation');
    }

    this.socket.emit('message:send', {
      conversationId: this.currentConversation,
      content,
      attachments
    });
  }

  // Mark message as read
  markMessageAsRead(messageId) {
    if (!this.currentConversation) {
      throw new Error('No active conversation');
    }

    this.socket.emit('message:read', {
      conversationId: this.currentConversation,
      messageId
    });
  }

  // Send typing indicator
  sendTypingStatus(isTyping) {
    if (!this.currentConversation) {
      throw new Error('No active conversation');
    }

    this.socket.emit('user:typing', {
      conversationId: this.currentConversation,
      isTyping
    });
  }

  // Create a new conversation
  async createConversation(type, name, participants) {
    try {
      const response = await fetch(`${this.apiUrl}/chat/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          name,
          participants
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const data = await response.json();
      this.conversations.push(data.data);
      return data.data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Load messages for a conversation
  async loadMessages(conversationId, limit = 50, before = null) {
    try {
      let url = `${this.apiUrl}/chat/conversations/${conversationId}/messages?limit=${limit}`;
      if (before) {
        url += `&before=${before}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error loading messages:', error);
      throw error;
    }
  }

  // Search users
  async searchUsers(query) {
    try {
      const response = await fetch(`${this.apiUrl}/users?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to search users');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  // Disconnect from chat server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

// Example usage:
/*
const chatClient = new GNChatClient(
  'http://localhost:3000/api',
  'http://localhost:3000',
  'your-auth-token'
);

// Initialize the client
chatClient.init().then(success => {
  if (success) {
    console.log('Chat client initialized successfully');
    
    // Register event handlers
    chatClient.on('onMessage', (message) => {
      console.log('New message received:', message);
      // Update UI with new message
    });
    
    chatClient.on('onUserStatus', (data) => {
      console.log('User status changed:', data);
      // Update UI with user status
    });
    
    // Load conversations
    chatClient.loadConversations().then(conversations => {
      console.log('Loaded conversations:', conversations);
      // Update UI with conversations
    });
    
    // Join a conversation
    chatClient.joinConversation('conversation-id');
    
    // Send a message
    chatClient.sendMessage('Hello, world!');
    
    // Create a new conversation
    chatClient.createConversation('direct', null, [123]).then(conversation => {
      console.log('Created conversation:', conversation);
      // Update UI with new conversation
    });
  }
});
*/
