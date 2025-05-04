const redis = require('redis');

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: `redis://${process.env.REDIS_HOST || 'redis_gn_farm'}:${process.env.REDIS_PORT || 6379}`,
      password: process.env.REDIS_PASSWORD || '',
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await redisClient.connect();
    
    console.log('Redis connected');
    return redisClient;
  } catch (error) {
    console.error('Redis connection error:', error);
    process.exit(1);
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis has not been initialized. Call connectRedis first.');
  }
  return redisClient;
};

module.exports = { connectRedis, getRedisClient };
