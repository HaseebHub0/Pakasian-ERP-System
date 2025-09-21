const request = require('supertest');
const app = require('../index');
const { initializeDatabase, runQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

describe('Protected Routes and Role-Based Access (Snacks Manufacturing)', () => {
  let adminToken, directorToken, accountantToken, gatekeeperToken;
  let adminUser, directorUser, accountantUser, gatekeeperUser;

  beforeAll(async () => {
    // Initialize test database
    await initializeDatabase();
    
    // Create test users for snacks manufacturing company
    const hashedPassword = await bcrypt.hash('testpassword123', 12);
    
    // Admin user
    const adminResult = await runQuery(
      'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5)',
      ['Test Admin', 'admin@pakasian.com', hashedPassword, 'admin', true]
    );
    adminUser = { id: adminResult.id, email: 'admin@pakasian.com', role: 'admin' };

    // Director user
    const directorResult = await runQuery(
      'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5)',
      ['Test Director', 'director@pakasian.com', hashedPassword, 'director', true]
    );
    directorUser = { id: directorResult.id, email: 'director@pakasian.com', role: 'director' };

    // Accountant user
    const accountantResult = await runQuery(
      'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5)',
      ['Test Accountant', 'accountant@pakasian.com', hashedPassword, 'accountant', true]
    );
    accountantUser = { id: accountantResult.id, email: 'accountant@pakasian.com', role: 'accountant' };

    // Gatekeeper user
    const gatekeeperResult = await runQuery(
      'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5)',
      ['Test Gatekeeper', 'gatekeeper@pakasian.com', hashedPassword, 'gatekeeper', true]
    );
    gatekeeperUser = { id: gatekeeperResult.id, email: 'gatekeeper@pakasian.com', role: 'gatekeeper' };

    // Login all users to get tokens
    const loginPromises = [
      request(app).post('/api/auth/login').send({ email: 'admin@pakasian.com', password: 'testpassword123' }),
      request(app).post('/api/auth/login').send({ email: 'director@pakasian.com', password: 'testpassword123' }),
      request(app).post('/api/auth/login').send({ email: 'accountant@pakasian.com', password: 'testpassword123' }),
      request(app).post('/api/auth/login').send({ email: 'gatekeeper@pakasian.com', password: 'testpassword123' })
    ];

    const loginResponses = await Promise.all(loginPromises);
    adminToken = loginResponses[0].body.accessToken;
    directorToken = loginResponses[1].body.accessToken;
    accountantToken = loginResponses[2].body.accessToken;
    gatekeeperToken = loginResponses[3].body.accessToken;
  });

  afterAll(async () => {
    // Cleanup test data
    const userIds = [adminUser.id, directorUser.id, accountantUser.id, gatekeeperUser.id];
    for (const userId of userIds) {
      await runQuery('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
      await runQuery('DELETE FROM users WHERE id = $1', [userId]);
    }
  });

  describe('Admin Only Routes (Full System Access)', () => {
    it('should allow admin to access system info', async () => {
      const response = await request(app)
        .get('/api/protected/admin/system-info')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Welcome, Test Admin! Full system access granted.');
      expect(response.body).toHaveProperty('permissions');
      expect(response.body.permissions).toContain('users');
      expect(response.body.permissions).toContain('products');
      expect(response.body.permissions).toContain('warehouses');
    });

    it('should allow admin to access user management', async () => {
      const response = await request(app)
        .get('/api/protected/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Admin Test Admin can manage all users.');
      expect(response.body).toHaveProperty('data');
    });

    it('should allow admin to access product management', async () => {
      const response = await request(app)
        .get('/api/protected/admin/products')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Admin Test Admin can manage all products.');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toContain('Protein Nimko 100g');
    });

    it('should deny non-admin users access to admin routes', async () => {
      const response = await request(app)
        .get('/api/protected/admin/system-info')
        .set('Authorization', `Bearer ${directorToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
      expect(response.body).toHaveProperty('required', ['admin']);
      expect(response.body).toHaveProperty('current', 'director');
    });
  });

  describe('Director Routes (Read-Only Executive Access)', () => {
    it('should allow director to access executive dashboard', async () => {
      const response = await request(app)
        .get('/api/protected/director/executive-dashboard')
        .set('Authorization', `Bearer ${directorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Welcome, Test Director! Executive dashboard - read-only access.');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('revenue', '₹50M');
      expect(response.body.data).toHaveProperty('profit', '₹8M');
    });

    it('should allow director to access strategic reports', async () => {
      const response = await request(app)
        .get('/api/protected/director/strategic-reports')
        .set('Authorization', `Bearer ${directorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Director Test Director can view strategic reports.');
      expect(response.body).toHaveProperty('reports');
      expect(response.body.reports).toContain('Market Analysis');
    });

    it('should allow director to access business performance', async () => {
      const response = await request(app)
        .get('/api/protected/director/business-performance')
        .set('Authorization', `Bearer ${directorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Director Test Director viewing business performance metrics.');
      expect(response.body).toHaveProperty('metrics');
      expect(response.body.metrics).toHaveProperty('sales_growth', '+12%');
    });

    it('should deny non-director users access to director routes', async () => {
      const response = await request(app)
        .get('/api/protected/director/executive-dashboard')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });
  });

  describe('Accountant Routes (Financial Management)', () => {
    it('should allow accountant to access financial reports', async () => {
      const response = await request(app)
        .get('/api/protected/accounting/financial-reports')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Welcome, Test Accountant! Financial reports access.');
      expect(response.body).toHaveProperty('reports');
      expect(response.body.reports).toContain('Balance Sheet');
    });

    it('should allow accountant to record sales', async () => {
      const response = await request(app)
        .post('/api/protected/accounting/record-sale')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Accountant Test Accountant recorded a sale.');
      expect(response.body).toHaveProperty('saleId');
      expect(response.body).toHaveProperty('amount');
    });

    it('should allow accountant to record purchases', async () => {
      const response = await request(app)
        .post('/api/protected/accounting/record-purchase')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Accountant Test Accountant recorded a purchase.');
      expect(response.body).toHaveProperty('purchaseId');
    });

    it('should allow accountant to record expenses', async () => {
      const response = await request(app)
        .post('/api/protected/accounting/record-expense')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Accountant Test Accountant recorded an expense.');
      expect(response.body).toHaveProperty('expenseId');
    });

    it('should allow accountant to generate profit/loss report', async () => {
      const response = await request(app)
        .get('/api/protected/accounting/profit-loss-report')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Accountant Test Accountant generated profit/loss report.');
      expect(response.body).toHaveProperty('report');
      expect(response.body.report).toHaveProperty('total_revenue', '₹50M');
      expect(response.body.report).toHaveProperty('net_profit', '₹8M');
    });

    it('should allow admin to access accountant routes', async () => {
      const response = await request(app)
        .get('/api/protected/accounting/financial-reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Welcome, Test Admin! Financial reports access.');
    });

    it('should deny non-accountant users access to accounting routes', async () => {
      const response = await request(app)
        .get('/api/protected/accounting/financial-reports')
        .set('Authorization', `Bearer ${directorToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });
  });

  describe('Gatekeeper Routes (Warehouse Gate Control)', () => {
    it('should allow gatekeeper to access warehouse dashboard', async () => {
      const response = await request(app)
        .get('/api/protected/gatekeeper/warehouse-dashboard')
        .set('Authorization', `Bearer ${gatekeeperToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Welcome, Test Gatekeeper! Warehouse gate control dashboard.');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('pending_trucks');
      expect(response.body.data).toHaveProperty('today_movements');
    });

    it('should allow gatekeeper to record truck entry', async () => {
      const response = await request(app)
        .post('/api/protected/gatekeeper/truck-entry')
        .set('Authorization', `Bearer ${gatekeeperToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Gatekeeper Test Gatekeeper recorded truck entry.');
      expect(response.body).toHaveProperty('truckId');
      expect(response.body).toHaveProperty('driver');
    });

    it('should allow gatekeeper to record truck exit', async () => {
      const response = await request(app)
        .post('/api/protected/gatekeeper/truck-exit')
        .set('Authorization', `Bearer ${gatekeeperToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Gatekeeper Test Gatekeeper recorded truck exit.');
      expect(response.body).toHaveProperty('truckId');
      expect(response.body).toHaveProperty('destination');
    });

    it('should allow gatekeeper to record inbound goods', async () => {
      const response = await request(app)
        .post('/api/protected/gatekeeper/goods-inbound')
        .set('Authorization', `Bearer ${gatekeeperToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Gatekeeper Test Gatekeeper recorded inbound goods movement.');
      expect(response.body).toHaveProperty('movementId');
      expect(response.body).toHaveProperty('product');
      expect(response.body).toHaveProperty('batch_number');
    });

    it('should allow gatekeeper to record outbound goods', async () => {
      const response = await request(app)
        .post('/api/protected/gatekeeper/goods-outbound')
        .set('Authorization', `Bearer ${gatekeeperToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Gatekeeper Test Gatekeeper recorded outbound goods movement.');
      expect(response.body).toHaveProperty('movementId');
      expect(response.body).toHaveProperty('product');
      expect(response.body).toHaveProperty('destination');
    });

    it('should allow gatekeeper to view movement history', async () => {
      const response = await request(app)
        .get('/api/protected/gatekeeper/movement-history')
        .set('Authorization', `Bearer ${gatekeeperToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Gatekeeper Test Gatekeeper viewing movement history.');
      expect(response.body).toHaveProperty('movements');
      expect(Array.isArray(response.body.movements)).toBe(true);
    });

    it('should allow admin to access gatekeeper routes', async () => {
      const response = await request(app)
        .get('/api/protected/gatekeeper/warehouse-dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Welcome, Test Admin! Warehouse gate control dashboard.');
    });

    it('should deny non-gatekeeper users access to gatekeeper routes', async () => {
      const response = await request(app)
        .get('/api/protected/gatekeeper/warehouse-dashboard')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });
  });

  describe('Shared Routes (Multiple Roles)', () => {
    it('should allow all roles to access product info', async () => {
      const responses = await Promise.all([
        request(app).get('/api/protected/shared/product-info').set('Authorization', `Bearer ${adminToken}`),
        request(app).get('/api/protected/shared/product-info').set('Authorization', `Bearer ${directorToken}`),
        request(app).get('/api/protected/shared/product-info').set('Authorization', `Bearer ${accountantToken}`),
        request(app).get('/api/protected/shared/product-info').set('Authorization', `Bearer ${gatekeeperToken}`)
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('products');
        expect(response.body.products).toContain('Protein Nimko 100g');
      });
    });

    it('should allow all roles to access warehouse status', async () => {
      const responses = await Promise.all([
        request(app).get('/api/protected/shared/warehouse-status').set('Authorization', `Bearer ${adminToken}`),
        request(app).get('/api/protected/shared/warehouse-status').set('Authorization', `Bearer ${directorToken}`),
        request(app).get('/api/protected/shared/warehouse-status').set('Authorization', `Bearer ${accountantToken}`),
        request(app).get('/api/protected/shared/warehouse-status').set('Authorization', `Bearer ${gatekeeperToken}`)
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('warehouses');
        expect(Array.isArray(response.body.warehouses)).toBe(true);
      });
    });
  });

  describe('General Protected Routes', () => {
    it('should allow any authenticated user to access profile', async () => {
      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'User profile');
      expect(response.body).toHaveProperty('user');
    });

    it('should allow any authenticated user to access role information', async () => {
      const response = await request(app)
        .get('/api/protected/roles')
        .set('Authorization', `Bearer ${directorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Role information');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('currentRole', 'director');
      expect(response.body.data).toHaveProperty('permissions');
      expect(response.body.data).toHaveProperty('company', 'Pakasian Foods Ltd');
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get('/api/protected/profile');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Access token required');
    });
  });

  describe('Token Validation', () => {
    it('should reject invalid tokens', async () => {
      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Invalid access token');
    });

    it('should reject expired tokens', async () => {
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: adminUser.id, role: 'admin', type: 'access' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Access token expired');
    });

    it('should reject tokens with wrong type', async () => {
      const jwt = require('jsonwebtoken');
      const wrongTypeToken = jwt.sign(
        { userId: adminUser.id, role: 'admin', type: 'refresh' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '15m' }
      );

      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', `Bearer ${wrongTypeToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid token type');
    });
  });

  describe('Snacks Manufacturing Specific Tests', () => {
    it('should have Pakasian Foods products in shared product info', async () => {
      const response = await request(app)
        .get('/api/protected/shared/product-info')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.products).toContain('Protein Nimko 100g');
      expect(response.body.products).toContain('Protein Nimko 250g');
      expect(response.body.products).toContain('Spicy Nimko Mix');
      expect(response.body.products).toContain('Salted Chips 50g');
      expect(response.body.products).toContain('Salted Chips 100g');
    });

    it('should have realistic financial data for snacks manufacturing', async () => {
      const response = await request(app)
        .get('/api/protected/accounting/profit-loss-report')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.report.total_revenue).toBe('₹50M');
      expect(response.body.report.net_profit).toBe('₹8M');
      expect(response.body.report.profit_margin).toBe('16%');
    });

    it('should have warehouse gate control functionality', async () => {
      const response = await request(app)
        .get('/api/protected/gatekeeper/warehouse-dashboard')
        .set('Authorization', `Bearer ${gatekeeperToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('pending_trucks');
      expect(response.body.data).toHaveProperty('today_movements');
      expect(response.body.data).toHaveProperty('warehouse_status', 'Active');
    });
  });
});