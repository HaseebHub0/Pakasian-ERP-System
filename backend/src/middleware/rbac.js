const { query } = require('../config/database');

// Role permissions mapping
const ROLE_PERMISSIONS = {
  admin: [
    'users:read', 'users:create', 'users:update', 'users:delete',
    'products:read', 'products:create', 'products:update', 'products:delete',
    'warehouses:read', 'warehouses:create', 'warehouses:update', 'warehouses:delete',
    'reports:read', 'audit:read'
  ],
  director: [
    'dashboard:read', 'reports:read', 'sales:read', 'purchases:read',
    'invoices:read', 'expenses:read', 'products:read', 'warehouses:read'
  ],
  accountant: [
    'sales:read', 'sales:create', 'sales:update',
    'purchases:read', 'purchases:create', 'purchases:update',
    'invoices:read', 'invoices:create', 'invoices:update',
    'expenses:read', 'expenses:create', 'expenses:update',
    'reports:read', 'products:read', 'warehouses:read'
  ],
  gatekeeper: [
    'stock_in:read', 'stock_in:create', 'stock_in:update',
    'stock_out:read', 'stock_out:create', 'stock_out:update',
    'movements:read', 'trucks:read', 'trucks:create', 'trucks:update',
    'gate:read', 'gate:create', 'gate:update',
    'products:read', 'warehouses:read'
  ]
};

// Route to permission mapping
const ROUTE_PERMISSIONS = {
  // User management
  'GET /api/users': 'users:read',
  'POST /api/users': 'users:create',
  'PUT /api/users/:id': 'users:update',
  'DELETE /api/users/:id': 'users:delete',
  
  // Product management
  'GET /api/products': 'products:read',
  'POST /api/products': 'products:create',
  'PUT /api/products/:id': 'products:update',
  'DELETE /api/products/:id': 'products:delete',
  
  // Warehouse management
  'GET /api/warehouses': 'warehouses:read',
  'POST /api/warehouses': 'warehouses:create',
  'PUT /api/warehouses/:id': 'warehouses:update',
  'DELETE /api/warehouses/:id': 'warehouses:delete',
  
  // Sales management
  'GET /api/sales': 'sales:read',
  'POST /api/sales': 'sales:create',
  'PUT /api/sales/:id': 'sales:update',
  'DELETE /api/sales/:id': 'sales:delete',
  
  // Purchase management
  'GET /api/purchases': 'purchases:read',
  'POST /api/purchases': 'purchases:create',
  'PUT /api/purchases/:id': 'purchases:update',
  'DELETE /api/purchases/:id': 'purchases:delete',
  
  // Invoice management
  'GET /api/invoices': 'invoices:read',
  'POST /api/invoices': 'invoices:create',
  'PUT /api/invoices/:id': 'invoices:update',
  'DELETE /api/invoices/:id': 'invoices:delete',
  
  // Expense management
  'GET /api/expenses': 'expenses:read',
  'POST /api/expenses': 'expenses:create',
  'PUT /api/expenses/:id': 'expenses:update',
  'DELETE /api/expenses/:id': 'expenses:delete',
  
  // Stock movements
  'GET /api/stock-movements': 'movements:read',
  'POST /api/stock-movements': 'stock_in:create',
  'PUT /api/stock-movements/:id': 'stock_in:update',
  
  // Stock in/out
  'POST /api/stock-in': 'stock_in:create',
  'GET /api/stock-in': 'stock_in:read',
  'POST /api/stock-out': 'stock_out:create',
  'GET /api/stock-out': 'stock_out:read',
  
  // Truck management
  'GET /api/trucks': 'trucks:read',
  'POST /api/trucks/entry': 'trucks:create',
  'PUT /api/trucks/:id/exit': 'trucks:update',
  'GET /api/trucks/status/inside': 'trucks:read',
  
  // Reports
  'GET /api/reports': 'reports:read',
  'GET /api/reports/sales': 'reports:read',
  'GET /api/reports/purchases': 'reports:read',
  'GET /api/reports/financial': 'reports:read',
  
  // Dashboard
  'GET /api/dashboard': 'dashboard:read',
  
  // Audit logs
  'GET /api/audit-logs': 'audit:read'
};

// Check if user has permission for a specific action
function hasPermission(userRole, permission) {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

// Get permission required for a route
function getRequiredPermission(method, path) {
  const routeKey = `${method} ${path}`;
  return ROUTE_PERMISSIONS[routeKey];
}

// Role-based access control middleware
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = req.user.role;
    
    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        required: permission,
        userRole: userRole
      });
    }

    next();
  };
}

// Dynamic permission checker based on route
function checkRoutePermission(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const method = req.method;
  const path = req.route?.path || req.path;
  const permission = getRequiredPermission(method, path);

  if (!permission) {
    // If no specific permission is defined, allow access (for public routes)
    return next();
  }

  if (!hasPermission(req.user.role, permission)) {
    return res.status(403).json({ 
      message: 'Access denied. Insufficient permissions.',
      required: permission,
      userRole: req.user.role,
      route: `${method} ${path}`
    });
  }

  next();
}

// Role-specific middleware
function requireRole(roles) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Role not authorized.',
        required: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
}

// Gatekeeper specific middleware - can only access their own entries
function requireOwnership(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role === 'gatekeeper') {
    // Gatekeepers can only access their own entries
    req.query.user_id = req.user.id;
  }

  next();
}

module.exports = {
  requirePermission,
  requireRole,
  requireOwnership,
  checkRoutePermission,
  hasPermission,
  getRequiredPermission,
  ROLE_PERMISSIONS,
  ROUTE_PERMISSIONS
};
