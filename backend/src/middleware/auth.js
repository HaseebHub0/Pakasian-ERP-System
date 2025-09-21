const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query, runQuery } = require('../config/database');

// Token generation utilities
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role, type: 'access' },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '15m' } // Short-lived access token
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    { expiresIn: '7d' } // Long-lived refresh token
  );

  return { accessToken, refreshToken };
};

// Verify access token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (decoded.type !== 'access') {
      return res.status(401).json({ message: 'Invalid token type' });
    }
    
    // Get user from database
    const user = await query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Invalid token or user inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Access token expired' });
    }
    return res.status(403).json({ message: 'Invalid access token' });
  }
};

// Verify refresh token
const authenticateRefreshToken = async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid token type' });
    }
    
    // Get user from database
    const user = await query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Invalid refresh token or user inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Refresh token expired' });
    }
    return res.status(403).json({ message: 'Invalid refresh token' });
  }
};

// Store refresh token in database
const storeRefreshToken = async (userId, refreshToken) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  await runQuery(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3',
    [userId, refreshToken, expiresAt]
  );
};

// Revoke refresh token
const revokeRefreshToken = async (userId) => {
  await runQuery('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
};

// Role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
};

// Specific role middleware for snacks manufacturing company
const requireAdmin = requireRole(['admin']);
const requireAccountant = requireRole(['admin', 'accountant']);
const requireDirector = requireRole(['admin', 'director']);
const requireGatekeeper = requireRole(['admin', 'gatekeeper']);

// Role-specific access levels
const requireAdminOrDirector = requireRole(['admin', 'director']);
const requireFinancialAccess = requireRole(['admin', 'accountant']);
const requireWarehouseAccess = requireRole(['admin', 'gatekeeper']);
const requireReadOnlyAccess = requireRole(['admin', 'director', 'accountant', 'gatekeeper']);

module.exports = {
  generateTokens,
  authenticateToken,
  authenticateRefreshToken,
  storeRefreshToken,
  revokeRefreshToken,
  requireRole,
  requireAdmin,
  requireAccountant,
  requireDirector,
  requireGatekeeper,
  requireAdminOrDirector,
  requireFinancialAccess,
  requireWarehouseAccess,
  requireReadOnlyAccess
};
