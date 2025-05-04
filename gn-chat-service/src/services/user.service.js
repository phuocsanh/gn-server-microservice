const { getPool } = require('../config/postgres');
const { getRedisClient } = require('../config/redis');

/**
 * Get user information from PostgreSQL
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - User information
 */
const getUserInfo = async (userId) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
        user_id, 
        user_account, 
        user_nickname, 
        user_avatar, 
        user_state,
        user_mobile,
        user_email
      FROM pre_go_acc_user_info_9999 
      WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error getting user info:', error);
    throw error;
  }
};

/**
 * Get multiple users information
 * @param {number[]} userIds - Array of user IDs
 * @returns {Promise<Object[]>} - Array of user information
 */
const getUsersInfo = async (userIds) => {
  try {
    if (!userIds || userIds.length === 0) {
      return [];
    }

    const pool = getPool();
    const result = await pool.query(
      `SELECT 
        user_id, 
        user_account, 
        user_nickname, 
        user_avatar, 
        user_state
      FROM pre_go_acc_user_info_9999 
      WHERE user_id = ANY($1)`,
      [userIds]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting users info:', error);
    throw error;
  }
};

/**
 * Get user online status from Redis
 * @param {number} userId - User ID
 * @returns {Promise<string>} - User status ('online' or 'offline')
 */
const getUserStatus = async (userId) => {
  try {
    const redisClient = getRedisClient();
    const status = await redisClient.get(`user:${userId}:status`);
    return status || 'offline';
  } catch (error) {
    console.error('Error getting user status:', error);
    return 'offline';
  }
};

/**
 * Get multiple users online status
 * @param {number[]} userIds - Array of user IDs
 * @returns {Promise<Object>} - Object with user IDs as keys and status as values
 */
const getUsersStatus = async (userIds) => {
  try {
    if (!userIds || userIds.length === 0) {
      return {};
    }

    const redisClient = getRedisClient();
    const pipeline = redisClient.multi();
    
    userIds.forEach(userId => {
      pipeline.get(`user:${userId}:status`);
    });
    
    const results = await pipeline.exec();
    
    const statusMap = {};
    userIds.forEach((userId, index) => {
      statusMap[userId] = results[index] || 'offline';
    });
    
    return statusMap;
  } catch (error) {
    console.error('Error getting users status:', error);
    
    // Return all users as offline in case of error
    const statusMap = {};
    userIds.forEach(userId => {
      statusMap[userId] = 'offline';
    });
    
    return statusMap;
  }
};

module.exports = {
  getUserInfo,
  getUsersInfo,
  getUserStatus,
  getUsersStatus
};
