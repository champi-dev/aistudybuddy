const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticateToken = async (req, res, next) => {
  // Development bypass - check for dev-user-id header
  if (process.env.NODE_ENV === 'development') {
    const devUserId = req.headers['dev-user-id'];
    if (devUserId) {
      const user = await db('users').where({ id: devUserId }).first();
      if (user) {
        req.user = user;
        return next();
      }
    }
    
    // Fallback to token-based auth even in development
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db('users').where({ id: decoded.id }).first();
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

module.exports = { authenticateToken, requireAuth };