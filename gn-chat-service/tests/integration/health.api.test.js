const request = require('supertest');
const express = require('express');

// Create a simple test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Simple health endpoint for testing
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        api: { status: 'healthy' }
      }
    });
  });

  app.get('/ready', (req, res) => {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/live', (req, res) => {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Test API endpoints
  app.get('/api/test', (req, res) => {
    res.status(200).json({
      message: 'Test endpoint working',
      timestamp: new Date().toISOString()
    });
  });

  app.post('/api/test', (req, res) => {
    const { data } = req.body;
    res.status(201).json({
      message: 'Data received',
      data: data,
      timestamp: new Date().toISOString()
    });
  });

  // Error endpoint for testing error handling
  app.get('/api/error', (req, res) => {
    res.status(500).json({
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  });

  return app;
};

describe('Health API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.version).toBe('1.0.0');
      expect(response.body.services).toBeDefined();
      expect(response.body.services.api.status).toBe('healthy');
    });
  });

  describe('GET /ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/ready')
        .expect(200);

      expect(response.body.status).toBe('ready');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /live', () => {
    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/live')
        .expect(200);

      expect(response.body.status).toBe('alive');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
      expect(typeof response.body.uptime).toBe('number');
    });
  });

  describe('GET /api/test', () => {
    it('should return test message', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.body.message).toBe('Test endpoint working');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('POST /api/test', () => {
    it('should accept and return data', async () => {
      const testData = { name: 'test', value: 123 };

      const response = await request(app)
        .post('/api/test')
        .send({ data: testData })
        .expect(201);

      expect(response.body.message).toBe('Data received');
      expect(response.body.data).toEqual(testData);
      expect(response.body.timestamp).toBeDefined();
    });

    it('should handle empty data', async () => {
      const response = await request(app)
        .post('/api/test')
        .send({})
        .expect(201);

      expect(response.body.message).toBe('Data received');
      expect(response.body.data).toBeUndefined();
    });
  });

  describe('GET /api/error', () => {
    it('should return error response', async () => {
      const response = await request(app)
        .get('/api/error')
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('404 handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      await request(app)
        .get('/api/nonexistent')
        .expect(404);
    });
  });

  describe('Request validation', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/test')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });
  });

  describe('Headers', () => {
    it('should return correct content type', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Response time', () => {
    it('should respond quickly', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/health')
        .expect(200);
      
      const responseTime = Date.now() - start;
      expect(responseTime).toBeLessThan(100); // Should respond within 100ms
    });
  });

  describe('Concurrent requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array(5).fill().map(() => 
        request(app).get('/health').expect(200)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.body.status).toBe('healthy');
      });
    });
  });

  describe('Request methods', () => {
    it('should handle different HTTP methods appropriately', async () => {
      // GET should work
      await request(app)
        .get('/api/test')
        .expect(200);

      // POST should work
      await request(app)
        .post('/api/test')
        .send({ data: 'test' })
        .expect(201);

      // PUT should return 404 (not implemented)
      await request(app)
        .put('/api/test')
        .expect(404);

      // DELETE should return 404 (not implemented)
      await request(app)
        .delete('/api/test')
        .expect(404);
    });
  });
});
