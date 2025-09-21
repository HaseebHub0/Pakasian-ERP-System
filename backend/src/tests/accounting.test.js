const request = require('supertest');
const app = require('../index');
const { initializeDatabase, runQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

describe('Accounting Module Endpoints', () => {
  let accountantToken;
  let accountantUser;
  let testProduct;

  beforeAll(async () => {
    await initializeDatabase();
    const hashedPassword = await bcrypt.hash('testpassword123', 12);

    // Create test accountant user
    const userResult = await runQuery(
      'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      ['Test Accountant', 'accountant@test.com', hashedPassword, 'accountant', true]
    );
    accountantUser = { id: userResult.id, email: 'accountant@test.com', role: 'accountant' };

    // Create test product
    const productResult = await runQuery(`
      INSERT INTO products (
        name, sku, barcode, description, category, brand, unit_of_measure, 
        cost_price, selling_price, min_stock_level, current_stock, 
        batch_number, expiry_date, supplier_name, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
      RETURNING id
    `, [
      'Test Product', 'TEST-001', '123456789', 'Test product for accounting',
      'Snacks', 'Pakasian Foods', 'pkt', 10.00, 15.00, 10, 100,
      'TEST-BATCH-001', '2025-12-31', 'Test Supplier', true
    ]);
    testProduct = { id: productResult.id };

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'accountant@test.com', password: 'testpassword123' });
    
    accountantToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await runQuery('DELETE FROM sales_invoice_items WHERE product_id = $1', [testProduct.id]);
    await runQuery('DELETE FROM sales_invoices WHERE created_by = $1', [accountantUser.id]);
    await runQuery('DELETE FROM expenses WHERE created_by = $1', [accountantUser.id]);
    await runQuery('DELETE FROM purchase_items WHERE purchase_id IN (SELECT id FROM purchases WHERE created_by = $1)', [accountantUser.id]);
    await runQuery('DELETE FROM purchases WHERE created_by = $1', [accountantUser.id]);
    await runQuery('DELETE FROM products WHERE id = $1', [testProduct.id]);
    await runQuery('DELETE FROM users WHERE id = $1', [accountantUser.id]);
  });

  describe('GET /api/protected/accounting/dashboard', () => {
    it('should fetch accounting dashboard data', async () => {
      const response = await request(app)
        .get('/api/protected/accounting/dashboard')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.dashboard).toBeDefined();
      expect(response.body.dashboard.summary).toBeDefined();
      expect(response.body.dashboard.dailySales).toBeDefined();
      expect(response.body.dashboard.dailyExpenses).toBeDefined();
      expect(response.body.dashboard.dailyPurchases).toBeDefined();
      expect(response.body.dashboard.recentTransactions).toBeDefined();
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .get('/api/protected/accounting/dashboard');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/protected/accounting/purchases', () => {
    it('should create a new purchase order', async () => {
      const purchaseData = {
        supplier_name: 'Test Supplier',
        supplier_contact: 'John Doe',
        supplier_phone: '+92-300-1234567',
        supplier_email: 'john@testsupplier.com',
        supplier_address: 'Test Address, Karachi',
        purchase_date: '2024-01-20',
        expected_delivery_date: '2024-01-21',
        items: [
          {
            item_name: 'Raw Potatoes',
            item_category: 'raw_material',
            item_description: 'Fresh potatoes for chips',
            unit_of_measure: 'kg',
            quantity: 100,
            unit_price: 25.00,
            tax_rate: 15.00,
            notes: 'Grade A potatoes'
          }
        ],
        notes: 'Test purchase order'
      };

      const response = await request(app)
        .post('/api/protected/accounting/purchases')
        .set('Authorization', `Bearer ${accountantToken}`)
        .send(purchaseData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.purchase_number).toMatch(/^PO-2024-/);
      expect(response.body.data.total_amount).toBe(2875.00); // 100 * 25 * 1.15
    });

    it('should reject purchase with missing required fields', async () => {
      const incompleteData = {
        supplier_name: 'Test Supplier',
        // Missing: purchase_date, items
      };

      const response = await request(app)
        .post('/api/protected/accounting/purchases')
        .set('Authorization', `Bearer ${accountantToken}`)
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });
  });

  describe('GET /api/protected/accounting/purchases', () => {
    it('should fetch purchases list', async () => {
      const response = await request(app)
        .get('/api/protected/accounting/purchases')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter purchases by status', async () => {
      const response = await request(app)
        .get('/api/protected/accounting/purchases?status=paid')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/protected/accounting/expenses', () => {
    it('should create a new expense', async () => {
      const expenseData = {
        expense_category: 'utilities',
        expense_type: 'electricity',
        description: 'Monthly electricity bill',
        amount: 5000.00,
        expense_date: '2024-01-20',
        payment_method: 'bank_transfer',
        vendor_name: 'Karachi Electric Supply Company',
        vendor_contact: 'KESC Customer Service',
        reference_number: 'KESC-20240120',
        notes: 'Production facility electricity'
      };

      const response = await request(app)
        .post('/api/protected/accounting/expenses')
        .set('Authorization', `Bearer ${accountantToken}`)
        .send(expenseData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.expense_number).toMatch(/^EXP-2024-/);
      expect(response.body.data.amount).toBe(5000.00);
    });

    it('should reject expense with missing required fields', async () => {
      const incompleteData = {
        expense_category: 'utilities',
        // Missing: expense_type, description, amount, expense_date
      };

      const response = await request(app)
        .post('/api/protected/accounting/expenses')
        .set('Authorization', `Bearer ${accountantToken}`)
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });
  });

  describe('GET /api/protected/accounting/expenses', () => {
    it('should fetch expenses list', async () => {
      const response = await request(app)
        .get('/api/protected/accounting/expenses')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should filter expenses by category and date range', async () => {
      const response = await request(app)
        .get('/api/protected/accounting/expenses?category=utilities&start_date=2024-01-01&end_date=2024-01-31')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/protected/accounting/sales-invoices', () => {
    it('should create a new sales invoice', async () => {
      const invoiceData = {
        customer_name: 'Test Customer',
        customer_contact: 'Jane Smith',
        customer_phone: '+92-300-7654321',
        customer_email: 'jane@testcustomer.com',
        customer_address: 'Customer Address, Karachi',
        customer_type: 'retail',
        invoice_date: '2024-01-20',
        due_date: '2024-02-19',
        items: [
          {
            product_id: testProduct.id,
            product_name: 'Test Product',
            product_sku: 'TEST-001',
            quantity: 10,
            unit_price: 15.00,
            discount_percentage: 0,
            tax_rate: 15.00,
            notes: 'Test sale'
          }
        ],
        notes: 'Test sales invoice'
      };

      const response = await request(app)
        .post('/api/protected/accounting/sales-invoices')
        .set('Authorization', `Bearer ${accountantToken}`)
        .send(invoiceData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.invoice_number).toMatch(/^INV-2024-/);
      expect(response.body.data.total_amount).toBe(172.50); // 10 * 15 * 1.15
    });

    it('should reject invoice with missing required fields', async () => {
      const incompleteData = {
        customer_name: 'Test Customer',
        // Missing: invoice_date, items
      };

      const response = await request(app)
        .post('/api/protected/accounting/sales-invoices')
        .set('Authorization', `Bearer ${accountantToken}`)
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });
  });

  describe('GET /api/protected/accounting/sales-invoices', () => {
    it('should fetch sales invoices list', async () => {
      const response = await request(app)
        .get('/api/protected/accounting/sales-invoices')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should filter invoices by status and customer type', async () => {
      const response = await request(app)
        .get('/api/protected/accounting/sales-invoices?status=paid&customer_type=retail')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/protected/accounting/profit-loss-report', () => {
    it('should generate profit & loss report', async () => {
      const response = await request(app)
        .get('/api/protected/accounting/profit-loss-report')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.report).toBeDefined();
      expect(response.body.report.period).toBeDefined();
      expect(response.body.report.revenue).toBeDefined();
      expect(response.body.report.purchases).toBeDefined();
      expect(response.body.report.expenses).toBeDefined();
      expect(response.body.report.profit).toBeDefined();
    });

    it('should generate report for custom date range', async () => {
      const response = await request(app)
        .get('/api/protected/accounting/profit-loss-report?start_date=2024-01-01&end_date=2024-01-31')
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.report.period.start_date).toBe('2024-01-01');
      expect(response.body.report.period.end_date).toBe('2024-01-31');
    });
  });

  describe('Role-based Access Control', () => {
    let adminToken, directorToken, gatekeeperToken;

    beforeAll(async () => {
      const hashedPassword = await bcrypt.hash('testpassword123', 12);

      // Create test users with different roles
      const adminResult = await runQuery(
        'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['Test Admin', 'admin@test.com', hashedPassword, 'admin', true]
      );

      const directorResult = await runQuery(
        'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['Test Director', 'director@test.com', hashedPassword, 'director', true]
      );

      const gatekeeperResult = await runQuery(
        'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['Test Gatekeeper', 'gatekeeper@test.com', hashedPassword, 'gatekeeper', true]
      );

      // Login to get tokens
      const [adminLogin, directorLogin, gatekeeperLogin] = await Promise.all([
        request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'testpassword123' }),
        request(app).post('/api/auth/login').send({ email: 'director@test.com', password: 'testpassword123' }),
        request(app).post('/api/auth/login').send({ email: 'gatekeeper@test.com', password: 'testpassword123' })
      ]);

      adminToken = adminLogin.body.accessToken;
      directorToken = directorLogin.body.accessToken;
      gatekeeperToken = gatekeeperLogin.body.accessToken;
    });

    afterAll(async () => {
      // Clean up test users
      await runQuery('DELETE FROM users WHERE email IN ($1, $2, $3)', ['admin@test.com', 'director@test.com', 'gatekeeper@test.com']);
    });

    it('should allow admin to access accounting endpoints', async () => {
      const response = await request(app)
        .get('/api/protected/accounting/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('should deny director access to accounting endpoints', async () => {
      const response = await request(app)
        .get('/api/protected/accounting/dashboard')
        .set('Authorization', `Bearer ${directorToken}`);

      expect(response.status).toBe(403);
    });

    it('should deny gatekeeper access to accounting endpoints', async () => {
      const response = await request(app)
        .get('/api/protected/accounting/dashboard')
        .set('Authorization', `Bearer ${gatekeeperToken}`);

      expect(response.status).toBe(403);
    });
  });
});
