const request = require('supertest');
const app = require('../index');
const { initializeDatabase, runQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

describe('Director Dashboard Endpoints', () => {
  let directorToken;
  let directorUser;
  let testProduct;
  let testInvoice;
  let testExpense;

  beforeAll(async () => {
    await initializeDatabase();
    const hashedPassword = await bcrypt.hash('testpassword123', 12);

    // Create test director user
    const userResult = await runQuery(
      'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      ['Test Director', 'director@test.com', hashedPassword, 'director', true]
    );
    directorUser = { id: userResult.id, email: 'director@test.com', role: 'director' };

    // Create test product
    const productResult = await runQuery(`
      INSERT INTO products (
        name, sku, barcode, description, category, brand, unit_of_measure, 
        cost_price, selling_price, min_stock_level, current_stock, 
        batch_number, expiry_date, supplier_name, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
      RETURNING id
    `, [
      'Test Product', 'TEST-001', '123456789', 'Test product for director dashboard',
      'Snacks', 'Pakasian Foods', 'pkt', 10.00, 15.00, 10, 5, // Low stock
      'TEST-BATCH-001', '2025-12-31', 'Test Supplier', true
    ]);
    testProduct = { id: productResult.id };

    // Create test sales invoice
    const invoiceResult = await runQuery(`
      INSERT INTO sales_invoices (
        invoice_number, customer_name, customer_contact, customer_type,
        invoice_date, subtotal, tax_amount, total_amount, paid_amount, balance_amount,
        payment_status, delivery_status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `, [
      'INV-TEST-001', 'Test Customer', 'Customer Contact', 'retail',
      new Date(), 100.00, 15.00, 115.00, 115.00, 0.00,
      'paid', 'delivered', directorUser.id
    ]);
    testInvoice = { id: invoiceResult.id };

    // Create test invoice item
    await runQuery(`
      INSERT INTO sales_invoice_items (
        invoice_id, product_id, product_name, product_sku, quantity, unit_price,
        total_price, discount_percentage, discount_amount, tax_rate, tax_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      testInvoice.id, testProduct.id, 'Test Product', 'TEST-001', 10, 10.00,
      100.00, 0, 0, 15.00, 15.00
    ]);

    // Create test expense
    const expenseResult = await runQuery(`
      INSERT INTO expenses (
        expense_number, expense_category, expense_type, description, amount,
        expense_date, payment_method, payment_status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      'EXP-TEST-001', 'utilities', 'electricity', 'Test electricity bill', 50.00,
      new Date(), 'bank_transfer', 'paid', directorUser.id
    ]);
    testExpense = { id: expenseResult.id };

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'director@test.com', password: 'testpassword123' });
    
    directorToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await runQuery('DELETE FROM sales_invoice_items WHERE invoice_id = $1', [testInvoice.id]);
    await runQuery('DELETE FROM sales_invoices WHERE id = $1', [testInvoice.id]);
    await runQuery('DELETE FROM expenses WHERE id = $1', [testExpense.id]);
    await runQuery('DELETE FROM products WHERE id = $1', [testProduct.id]);
    await runQuery('DELETE FROM users WHERE id = $1', [directorUser.id]);
  });

  describe('GET /api/protected/director/executive-dashboard', () => {
    it('should fetch director dashboard data successfully', async () => {
      const response = await request(app)
        .get('/api/protected/director/executive-dashboard')
        .set('Authorization', `Bearer ${directorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.dashboard).toBeDefined();
      expect(response.body.dashboard.financialSummary).toBeDefined();
      expect(response.body.dashboard.stockLevels).toBeDefined();
      expect(response.body.dashboard.dailySalesTrend).toBeDefined();
      expect(response.body.dashboard.monthlyData).toBeDefined();
      expect(response.body.dashboard.topSellingProducts).toBeDefined();
    });

    it('should fetch dashboard data with custom date range', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const response = await request(app)
        .get('/api/protected/director/executive-dashboard')
        .query({ start_date: startDate, end_date: endDate })
        .set('Authorization', `Bearer ${directorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.period.start_date).toBe(startDate);
      expect(response.body.period.end_date).toBe(endDate);
    });

    it('should include stock level information', async () => {
      const response = await request(app)
        .get('/api/protected/director/executive-dashboard')
        .set('Authorization', `Bearer ${directorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.dashboard.stockLevels).toBeDefined();
      expect(Array.isArray(response.body.dashboard.stockLevels)).toBe(true);
      
      if (response.body.dashboard.stockLevels.length > 0) {
        const product = response.body.dashboard.stockLevels[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('sku');
        expect(product).toHaveProperty('current_stock');
        expect(product).toHaveProperty('min_stock_level');
        expect(product).toHaveProperty('stock_status');
      }
    });

    it('should include low stock alerts', async () => {
      const response = await request(app)
        .get('/api/protected/director/executive-dashboard')
        .set('Authorization', `Bearer ${directorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.dashboard.lowStockAlerts).toBeDefined();
      expect(Array.isArray(response.body.dashboard.lowStockAlerts)).toBe(true);
    });

    it('should include daily sales trend data', async () => {
      const response = await request(app)
        .get('/api/protected/director/executive-dashboard')
        .set('Authorization', `Bearer ${directorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.dashboard.dailySalesTrend).toBeDefined();
      expect(Array.isArray(response.body.dashboard.dailySalesTrend)).toBe(true);
    });

    it('should include monthly income vs expenses data', async () => {
      const response = await request(app)
        .get('/api/protected/director/executive-dashboard')
        .set('Authorization', `Bearer ${directorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.dashboard.monthlyData).toBeDefined();
      expect(Array.isArray(response.body.dashboard.monthlyData)).toBe(true);
    });

    it('should include top selling products', async () => {
      const response = await request(app)
        .get('/api/protected/director/executive-dashboard')
        .set('Authorization', `Bearer ${directorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.dashboard.topSellingProducts).toBeDefined();
      expect(Array.isArray(response.body.dashboard.topSellingProducts)).toBe(true);
    });

    it('should calculate financial summary correctly', async () => {
      const response = await request(app)
        .get('/api/protected/director/executive-dashboard')
        .set('Authorization', `Bearer ${directorToken}`);

      expect(response.status).toBe(200);
      const summary = response.body.dashboard.financialSummary;
      
      expect(summary).toHaveProperty('total_revenue');
      expect(summary).toHaveProperty('total_expenses');
      expect(summary).toHaveProperty('total_purchases');
      expect(summary).toHaveProperty('net_profit');
      expect(summary).toHaveProperty('profit_margin');
      expect(summary).toHaveProperty('total_invoices');
      expect(summary).toHaveProperty('total_expense_entries');
      
      // Verify profit calculation
      const expectedNetProfit = summary.total_revenue - summary.total_expenses - summary.total_purchases;
      expect(summary.net_profit).toBe(expectedNetProfit);
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get('/api/protected/director/executive-dashboard');

      expect(response.status).toBe(401);
    });
  });

  describe('Role-based Access Control', () => {
    let adminToken, accountantToken, gatekeeperToken;

    beforeAll(async () => {
      const hashedPassword = await bcrypt.hash('testpassword123', 12);

      // Create test users with different roles
      const adminResult = await runQuery(
        'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['Test Admin', 'admin@test.com', hashedPassword, 'admin', true]
      );

      const accountantResult = await runQuery(
        'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['Test Accountant', 'accountant@test.com', hashedPassword, 'accountant', true]
      );

      const gatekeeperResult = await runQuery(
        'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['Test Gatekeeper', 'gatekeeper@test.com', hashedPassword, 'gatekeeper', true]
      );

      // Login to get tokens
      const [adminLogin, accountantLogin, gatekeeperLogin] = await Promise.all([
        request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'testpassword123' }),
        request(app).post('/api/auth/login').send({ email: 'accountant@test.com', password: 'testpassword123' }),
        request(app).post('/api/auth/login').send({ email: 'gatekeeper@test.com', password: 'testpassword123' })
      ]);

      adminToken = adminLogin.body.accessToken;
      accountantToken = accountantLogin.body.accessToken;
      gatekeeperToken = gatekeeperLogin.body.accessToken;
    });

    afterAll(async () => {
      // Clean up test users
      await runQuery('DELETE FROM users WHERE email IN ($1, $2, $3)', ['admin@test.com', 'accountant@test.com', 'gatekeeper@test.com']);
    });

    it('should allow admin to access director dashboard', async () => {
      const response = await request(app)
        .get('/api/protected/director/executive-dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('should allow director to access director dashboard', async () => {
      const response = await request(app)
        .get('/api/protected/director/executive-dashboard')
        .set('Authorization', `Bearer ${directorToken}`);

      expect(response.status).toBe(200);
    });

    it('should deny accountant access to director dashboard', async () => {
      const response = await request(app)
        .get('/api/protected/director/executive-dashboard')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(response.status).toBe(403);
    });

    it('should deny gatekeeper access to director dashboard', async () => {
      const response = await request(app)
        .get('/api/protected/director/executive-dashboard')
        .set('Authorization', `Bearer ${gatekeeperToken}`);

      expect(response.status).toBe(403);
    });
  });
});
