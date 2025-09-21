# Authentication API Documentation

This document provides comprehensive information about the ERP system's authentication API, including JWT tokens, role-based access control, and protected routes.

## 🔐 Authentication Overview

The ERP system uses a secure JWT-based authentication system with the following features:

- **JWT Access Tokens**: Short-lived (15 minutes) for API access
- **JWT Refresh Tokens**: Long-lived (7 days) for token renewal
- **Role-Based Access Control**: Granular permissions based on user roles
- **Password Security**: bcrypt hashing with salt rounds 12
- **Registration Disabled**: Only administrators can create user accounts

## 👥 User Roles

### Available Roles

1. **Admin** - Full system access
2. **Director** - Executive level access
3. **Accountant** - Financial and accounting permissions
4. **Storekeeper** - Inventory and warehouse management
5. **Gatekeeper** - Security and access control

### Role Hierarchy

```
Admin (highest)
├── Director
├── Accountant
├── Storekeeper
└── Gatekeeper (lowest)
```

## 🔑 Authentication Endpoints

### POST /api/auth/login

Login with email and password to receive JWT tokens.

**Request:**
```json
{
  "email": "admin@erp.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "System Administrator",
    "email": "admin@erp.com",
    "role": "admin",
    "is_active": true,
    "last_login": "2024-01-01T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation failed
- `401` - Invalid credentials or account deactivated

### POST /api/auth/refresh

Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "message": "Tokens refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401` - Refresh token expired
- `403` - Invalid refresh token

### POST /api/auth/logout

Logout and revoke refresh token.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

### GET /api/auth/verify

Verify access token validity.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Token is valid",
  "user": {
    "id": 1,
    "name": "System Administrator",
    "email": "admin@erp.com",
    "role": "admin",
    "is_active": true
  }
}
```

### GET /api/auth/profile

Get current user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "System Administrator",
    "email": "admin@erp.com",
    "role": "admin",
    "phone": "+1-555-0101",
    "address": "123 Admin Street, Tech City, TC 12345",
    "is_active": true,
    "last_login": "2024-01-01T12:00:00.000Z",
    "created_at": "2024-01-01T10:00:00.000Z",
    "updated_at": "2024-01-01T12:00:00.000Z"
  }
}
```

### POST /api/auth/register

**Status:** Disabled

**Response:**
```json
{
  "message": "User registration is disabled. Please contact an administrator to create your account."
}
```

## 🛡️ Protected Routes

### Admin Only Routes

#### GET /api/protected/admin/system-info
- **Access:** Admin only
- **Description:** System information and metrics

#### GET /api/protected/admin/users
- **Access:** Admin only
- **Description:** User management interface

### Director Routes

#### GET /api/protected/director/dashboard
- **Access:** Director, Admin
- **Description:** Executive dashboard with KPIs

#### GET /api/protected/director/reports
- **Access:** Director, Admin
- **Description:** Strategic business reports

### Accountant Routes

#### GET /api/protected/accounting/reports
- **Access:** Accountant, Admin
- **Description:** Financial reports and analytics

#### GET /api/protected/accounting/invoices
- **Access:** Accountant, Admin
- **Description:** Invoice management

#### GET /api/protected/accounting/ledger
- **Access:** Accountant, Admin
- **Description:** General ledger access

### Storekeeper Routes

#### GET /api/protected/inventory/products
- **Access:** Storekeeper, Admin
- **Description:** Product inventory management

#### GET /api/protected/inventory/movements
- **Access:** Storekeeper, Admin
- **Description:** Stock movement tracking

#### GET /api/protected/inventory/warehouses
- **Access:** Storekeeper, Admin
- **Description:** Warehouse management

### Gatekeeper Routes

#### GET /api/protected/gatekeeper/access-logs
- **Access:** Gatekeeper, Admin
- **Description:** System access logs

#### GET /api/protected/gatekeeper/security
- **Access:** Gatekeeper, Admin
- **Description:** Security monitoring

### Multi-Role Routes

#### GET /api/protected/management/users
- **Access:** Admin, Director
- **Description:** User management (Admin/Director level)

#### GET /api/protected/operations/inventory
- **Access:** Accountant, Storekeeper
- **Description:** Inventory operations

### General Protected Routes

#### GET /api/protected/profile
- **Access:** Any authenticated user
- **Description:** User profile information

#### GET /api/protected/roles
- **Access:** Any authenticated user
- **Description:** Role and permission information

## 🔒 Security Features

### Token Security

- **Access Tokens**: 15-minute expiration
- **Refresh Tokens**: 7-day expiration
- **Token Storage**: Refresh tokens stored in database
- **Token Revocation**: Logout revokes refresh tokens

### Password Security

- **Hashing**: bcrypt with salt rounds 12
- **Validation**: Minimum 6 characters
- **No Plain Text**: Passwords never stored in plain text

### Access Control

- **Role-Based**: Granular permissions per role
- **Token Validation**: Every request validates token
- **User Status**: Inactive users cannot authenticate
- **Audit Trail**: All authentication events logged

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run authentication tests only
npm run test:auth

# Run protected routes tests only
npm run test:protected

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

The test suite covers:
- Login/logout functionality
- Token refresh mechanism
- Role-based access control
- Protected route access
- Error handling
- Token validation

## 📝 Default Credentials

### Development Users

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Admin | admin@erp.com | admin123 | System Administrator |
| Director | director@erp.com | director123 | Executive Director |
| Accountant | accountant@erp.com | accountant123 | Chief Accountant |
| Storekeeper | storekeeper@erp.com | storekeeper123 | Warehouse Manager |
| Gatekeeper | gatekeeper@erp.com | gatekeeper123 | Security Officer |

## 🚀 Usage Examples

### Frontend Integration

```javascript
// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@erp.com',
    password: 'admin123'
  })
});

const { accessToken, refreshToken } = await loginResponse.json();

// Store tokens
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// Make authenticated requests
const response = await fetch('/api/protected/profile', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

### Token Refresh

```javascript
// Refresh token when access token expires
const refreshResponse = await fetch('/api/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    refreshToken: localStorage.getItem('refreshToken')
  })
});

const { accessToken, refreshToken } = await refreshResponse.json();

// Update stored tokens
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
```

### Logout

```javascript
// Logout and revoke tokens
await fetch('/api/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});

// Clear stored tokens
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
```

## ⚠️ Security Considerations

### Production Deployment

1. **Change Default Secrets**: Update JWT secrets in production
2. **HTTPS Only**: Use HTTPS for all authentication requests
3. **Token Storage**: Store tokens securely (httpOnly cookies recommended)
4. **Rate Limiting**: Implement rate limiting on auth endpoints
5. **Audit Logging**: Monitor authentication events
6. **Password Policy**: Enforce strong password requirements

### Environment Variables

```env
# Required for production
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key
NODE_ENV=production
```

## 🔧 Troubleshooting

### Common Issues

#### Token Expired
- **Error**: "Access token expired"
- **Solution**: Use refresh token to get new access token

#### Invalid Token
- **Error**: "Invalid access token"
- **Solution**: Re-authenticate with login endpoint

#### Insufficient Permissions
- **Error**: "Insufficient permissions"
- **Solution**: Check user role and required permissions

#### Account Deactivated
- **Error**: "Account is deactivated"
- **Solution**: Contact administrator to reactivate account

---

**Note**: Always use HTTPS in production and keep JWT secrets secure!
