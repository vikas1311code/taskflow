const { verifyAccessToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/response');
const { query } = require('../config/database');
const logger = require('../utils/logger');

// Authenticate JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Access token required', 401);
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Access token expired', 401);
      }
      return errorResponse(res, 'Invalid access token', 401);
    }

    // Verify user still exists and is active
    const result = await query(
      `SELECT id, name, email, role, is_active FROM users WHERE id = $1`,
      [decoded.sub]
    );

    if (!result.rows.length || !result.rows[0].is_active) {
      return errorResponse(res, 'User not found or deactivated', 401);
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return errorResponse(res, 'Authentication failed', 500);
  }
};

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Not authenticated', 401);
    }
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 'Insufficient permissions', 403);
    }
    next();
  };
};

// Resource ownership check (user can only access own resources, admin can access all)
const ownerOrAdmin = (userIdField = 'user_id') => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Not authenticated', 401);
    }
    req.isOwnerOrAdmin = true;
    req.targetUserId = req.user.role === 'admin' ? null : req.user.id;
    next();
  };
};

module.exports = { authenticate, authorize, ownerOrAdmin };
