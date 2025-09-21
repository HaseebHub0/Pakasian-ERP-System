# Role-Based Access Control (RBAC) Implementation

## Overview
This document outlines the comprehensive Role-Based Access Control (RBAC) system implemented for the Pakasian ERP System. The system enforces strict role-based permissions at both the backend API level and frontend UI level.

## Role Definitions

### 1. **Admin** (`admin`)
- **Full system access** - Can manage all aspects of the system
- **Allowed Operations:**
  - Manage users (create, read, update, delete)
  - Manage products (create, read, update, delete)
  - Manage warehouses (create, read, update, delete)
  - View all reports and audit logs
  - Access all financial data
  - Access all stock movements
- **UI Access:** All navigation items visible

### 2. **Director** (`director`)
- **Read-only dashboard access** - Cannot add or edit data
- **Allowed Operations:**
  - View executive dashboard (sales trends, profit/loss, stock levels)
  - View strategic reports
  - View financial reports
  - View sales data (read-only)
  - View purchase data (read-only)
  - View product and warehouse information (read-only)
- **UI Access:** Dashboard, Reports, Products, Warehouses only

### 3. **Accountant** (`accountant`)
- **Financial data management** - Cannot manage users or products
- **Allowed Operations:**
  - Create, read, update sales invoices
  - Create, read, update purchase invoices
  - Create, read, update expenses
  - View financial reports
  - View product and warehouse information (read-only)
- **UI Access:** Finance section, Sales, Purchases, Invoices, Reports, Products, Warehouses

### 4. **Gatekeeper** (`gatekeeper`)
- **Warehouse operations only** - Can only access their own entries
- **Allowed Operations:**
  - Create stock_in movements
  - Create stock_out movements
  - View their own stock movements
  - Manage truck entries
  - View product and warehouse information (read-only)
- **UI Access:** Warehouse section, Stock Movements, Truck Management, Products, Warehouses

## Backend Implementation

### 1. RBAC Middleware (`backend/src/middleware/rbac.js`)

```javascript
// Role permissions mapping
const ROLE_PERMISSIONS = {
  admin: ['users:read', 'users:create', 'users:update', 'users:delete', ...],
  director: ['dashboard:read', 'reports:read', 'sales:read', ...],
  accountant: ['sales:read', 'sales:create', 'invoices:create', ...],
  gatekeeper: ['stock_in:create', 'stock_out:create', 'movements:read', ...]
};

// Route to permission mapping
const ROUTE_PERMISSIONS = {
  'GET /api/users': 'users:read',
  'POST /api/users': 'users:create',
  'GET /api/dashboard': 'dashboard:read',
  // ... more routes
};
```

### 2. Protected Routes

#### Stock Movements (`/api/stock-movements`)
- **GET** `/api/stock-movements` - Gatekeepers see only their own entries
- **POST** `/api/stock-movements/stock-in` - Gatekeeper/Admin only
- **POST** `/api/stock-movements/stock-out` - Gatekeeper/Admin only

#### Sales (`/api/sales`)
- **GET** `/api/sales` - Accountant/Admin only
- **POST** `/api/sales` - Accountant/Admin only
- **PUT** `/api/sales/:id` - Accountant/Admin only

#### Dashboard (`/api/dashboard`)
- **GET** `/api/dashboard` - Director/Admin only
- **GET** `/api/dashboard/financial` - Director/Admin only

### 3. Permission Enforcement

```javascript
// Example usage in routes
router.post('/stock-in', [
  authenticateToken,
  requirePermission('stock_in:create'),
  // ... validation middleware
], async (req, res) => {
  // Route handler
});
```

## Frontend Implementation

### 1. Role-Based Navigation

The sidebar navigation dynamically shows/hides menu items based on user role:

```javascript
// Admin Section - Only for Admin role
{user.role === 'admin' && (
  <div>
    {/* Admin menu items */}
  </div>
)}

// Director Section - Only for Director role
{user.role === 'director' && (
  <div>
    {/* Director menu items */}
  </div>
)}
```

### 2. UI Permission Enforcement

- **Navigation items** are hidden based on role
- **Action buttons** are conditionally rendered
- **Page access** is controlled by role checks
- **Form submissions** are validated on both frontend and backend

## Test Users

The system includes the following test users for testing RBAC:

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| Admin | `admin1@pakasian.com` | `password123` | Full system access |
| Director | `director1@pakasian.com` | `password123` | Read-only dashboard |
| Accountant | `accountant1@pakasian.com` | `password123` | Financial data management |
| Gatekeeper | `gatekeeper1@pakasian.com` | `password123` | Warehouse operations only |

## Testing RBAC

### 1. Automated Testing

Run the comprehensive RBAC test suite:

```bash
cd backend
node test-rbac.js
```

This will test:
- Login for each role
- Allowed operations for each role
- Forbidden operations for each role
- API endpoint access control

### 2. Manual Testing with cURL

#### Test Admin Access (Should work)
```bash
# Login as admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin1@pakasian.com","password":"password123"}'

# Use the returned token for subsequent requests
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test Gatekeeper Access (Should be forbidden)
```bash
# Login as gatekeeper
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gatekeeper1@pakasian.com","password":"password123"}'

# Try to access admin function (should return 403)
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Expected Results

#### Admin Role
- ✅ Can access all endpoints
- ✅ Can manage users, products, warehouses
- ✅ Can view all reports and dashboards
- ✅ Can perform all CRUD operations

#### Director Role
- ✅ Can access dashboard and reports (read-only)
- ❌ Cannot create/edit sales, purchases, or stock movements
- ❌ Cannot manage users, products, or warehouses
- ✅ Can view financial data and analytics

#### Accountant Role
- ✅ Can manage sales, purchases, invoices, expenses
- ✅ Can view financial reports
- ❌ Cannot manage users, products, or warehouses
- ❌ Cannot access stock movements or truck management

#### Gatekeeper Role
- ✅ Can create stock_in and stock_out movements
- ✅ Can view their own stock movements
- ✅ Can manage truck entries
- ❌ Cannot access sales, purchases, or financial data
- ❌ Cannot manage users, products, or warehouses

## Security Features

### 1. JWT Token Validation
- All API requests require valid JWT tokens
- Tokens include role information
- Tokens expire after 15 minutes (access) / 7 days (refresh)

### 2. Permission-Based Access Control
- Each API endpoint checks for specific permissions
- Role permissions are defined in a centralized configuration
- Unauthorized access returns 403 Forbidden

### 3. Data Isolation
- Gatekeepers can only see their own stock movement entries
- All data access is filtered by user role
- Audit logging tracks all access attempts

### 4. Frontend Security
- Navigation items are hidden based on role
- API calls are validated on both frontend and backend
- Error handling provides appropriate feedback

## Error Handling

### Backend Error Responses

```json
// 401 Unauthorized
{
  "message": "Authentication required"
}

// 403 Forbidden
{
  "message": "Access denied. Insufficient permissions.",
  "required": "users:create",
  "userRole": "gatekeeper",
  "route": "POST /api/users"
}
```

### Frontend Error Handling

- Unauthorized access redirects to login
- Forbidden access shows appropriate error messages
- Network errors are handled gracefully
- User feedback is provided for all error states

## Maintenance and Updates

### Adding New Roles
1. Update `ROLE_PERMISSIONS` in `rbac.js`
2. Add role-specific routes and middleware
3. Update frontend navigation logic
4. Add test cases for new role

### Adding New Permissions
1. Define permission in `ROLE_PERMISSIONS`
2. Map route to permission in `ROUTE_PERMISSIONS`
3. Apply `requirePermission` middleware to route
4. Update frontend UI logic
5. Add test cases

### Modifying Existing Permissions
1. Update permission mapping in `rbac.js`
2. Test all affected routes
3. Update frontend UI accordingly
4. Run comprehensive test suite

## Conclusion

This RBAC implementation provides:
- **Comprehensive security** at both API and UI levels
- **Granular permission control** for different user roles
- **Easy maintenance** with centralized permission management
- **Thorough testing** with automated test suites
- **Clear documentation** for future development

The system ensures that users can only access the features and data appropriate to their role, maintaining security and data integrity throughout the ERP system.
