const mongoose = require('mongoose');
const { Pool } = require('pg');
const redis = require('../config/redis');

class HealthController {
  constructor() {
    this.startTime = Date.now();
  }

  // Basic health check
  async healthCheck(req, res) {
    try {
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: this.getUptime(),
        services: {}
      };

      // Check all services
      const [mongoStatus, postgresStatus, redisStatus] = await Promise.allSettled([
        this.checkMongoDB(),
        this.checkPostgreSQL(),
        this.checkRedis()
      ]);

      healthStatus.services.mongodb = this.getServiceResult(mongoStatus);
      healthStatus.services.postgresql = this.getServiceResult(postgresStatus);
      healthStatus.services.redis = this.getServiceResult(redisStatus);

      // Determine overall status
      const allHealthy = Object.values(healthStatus.services)
        .every(service => service.status === 'healthy');

      healthStatus.status = allHealthy ? 'healthy' : 'unhealthy';

      const statusCode = allHealthy ? 200 : 503;
      res.status(statusCode).json(healthStatus);

    } catch (error) {
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  // Readiness check - checks if service is ready to serve requests
  async readinessCheck(req, res) {
    try {
      const [mongoStatus, postgresStatus, redisStatus] = await Promise.allSettled([
        this.checkMongoDB(),
        this.checkPostgreSQL(),
        this.checkRedis()
      ]);

      const mongoHealthy = mongoStatus.status === 'fulfilled' && mongoStatus.value.status === 'healthy';
      const postgresHealthy = postgresStatus.status === 'fulfilled' && postgresStatus.value.status === 'healthy';
      const redisHealthy = redisStatus.status === 'fulfilled' && redisStatus.value.status === 'healthy';

      if (mongoHealthy && postgresHealthy && redisHealthy) {
        res.status(200).json({
          status: 'ready',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          status: 'not ready',
          timestamp: new Date().toISOString(),
          services: {
            mongodb: mongoHealthy,
            postgresql: postgresHealthy,
            redis: redisHealthy
          }
        });
      }
    } catch (error) {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  // Liveness check - simple check if service is alive
  async livenessCheck(req, res) {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      pid: process.pid,
      memory: process.memoryUsage(),
      nodeVersion: process.version
    });
  }

  // Check MongoDB connection
  async checkMongoDB() {
    const start = Date.now();
    
    try {
      if (mongoose.connection.readyState !== 1) {
        throw new Error('MongoDB not connected');
      }

      // Perform a simple operation to test connection
      await mongoose.connection.db.admin().ping();
      
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        details: {
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: `${Date.now() - start}ms`,
        error: error.message
      };
    }
  }

  // Check PostgreSQL connection
  async checkPostgreSQL() {
    const start = Date.now();
    
    try {
      const pool = new Pool({
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
        max: 1, // Only one connection for health check
        idleTimeoutMillis: 1000,
        connectionTimeoutMillis: 2000,
      });

      const client = await pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      await pool.end();

      const responseTime = Date.now() - start;

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        details: {
          serverTime: result.rows[0].now
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: `${Date.now() - start}ms`,
        error: error.message
      };
    }
  }

  // Check Redis connection
  async checkRedis() {
    const start = Date.now();
    
    try {
      // Lấy Redis client từ module redis
      const redisClient = redis.getRedisClient(); // Sửa tên hàm từ getClient thành getRedisClient
      
      if (!redisClient || !redisClient.isOpen) {
        throw new Error('Redis client not connected');
      }

      await redisClient.ping();
      
      const responseTime = Date.now() - start;

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        details: {
          connected: redisClient.isOpen,
          ready: redisClient.isReady
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: `${Date.now() - start}ms`,
        error: error.message
      };
    }
  }

  // Helper method to get service result from Promise.allSettled
  getServiceResult(settledResult) {
    if (settledResult.status === 'fulfilled') {
      return settledResult.value;
    } else {
      return {
        status: 'unhealthy',
        error: settledResult.reason.message
      };
    }
  }

  // Get uptime in human readable format
  getUptime() {
    const uptimeMs = Date.now() - this.startTime;
    const uptimeSeconds = Math.floor(uptimeMs / 1000);
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    
    return `${hours}h ${minutes}m ${seconds}s`;
  }
}

module.exports = new HealthController();
