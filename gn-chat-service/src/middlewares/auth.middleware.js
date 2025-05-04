const jwt = require('jsonwebtoken');
const { getUserInfo } = require('../services/user.service');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication token is missing' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'xxx.yyy.zzz');
    
    // Get user from database
    const user = await getUserInfo(decoded.user_id);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Check if user is active
    if (user.user_state !== 1) {
      return res.status(403).json({ 
        success: false, 
        message: 'User account is not active' 
      });
    }
    
    // Attach user to request
    req.user = {
      id: user.user_id,
      account: user.user_account,
      nickname: user.user_nickname,
      avatar: user.user_avatar,
      email: user.user_email,
      mobile: user.user_mobile
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

module.exports = authMiddleware;
