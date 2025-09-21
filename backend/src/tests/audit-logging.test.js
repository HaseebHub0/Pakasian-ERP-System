const request = require('supertest');
const app = require('../index');
const { initializeDatabase, runQuery } = require('../config/database');
const bcrypt = require('bcryptjs');
const auditService = require('../services/auditService');
const encryptionService = require('../services/encryptionService');

describe('Enhanced Audit Logging System', () => {
  let adminToken, gatekeeperToken, accountantToken;
  let adminUser, gatekeeperUser, accountantUser;
  let testProduct, testWarehouse;

  beforeAll(async () => {
    await initializeDatabase();
    const hashedPassword = await bcrypt.hash('testpassword123', 12);

    // Create test users
    const adminResult = await runQuery(
      'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      ['Test Admin', 'admin@test.com', hashedPassword, 'admin', true]
    );
    adminUser = { id: adminResult.id, email: 'admin@test.com', role: 'admin' };

    const gatekeeperResult = await runQuery(
      'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      ['Test Gatekeeper', 'gatekeeper@test.com', hashedPassword, 'gatekeeper', true]
    );
    gatekeeperUser = { id: gatekeeperResult.id, email: 'gatekeeper@test.com', role: 'gatekeeper' };

    const accountantResult = await runQuery(
      'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      ['Test Accountant', 'accountant@test.com', hashedPassword, 'accountant', true]
    );
    accountantUser = { id: accountantResult.id, email: 'accountant@test.com', role: 'accountant' };

    // Create test product
    const productResult = await runQuery(`
      INSERT INTO products (
        name, sku, barcode, description, category, brand, unit_of_measure, 
        cost_price, selling_price, min_stock_level, current_stock, 
        batch_number, expiry_date, supplier_name, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
      RETURNING id
    `, [
      'Test Product', 'TEST-001', '123456789', 'Test product for audit logging',
      'Snacks', 'Pakasian Foods', 'pkt', 10.00, 15.00, 10, 50,
      'TEST-BATCH-001', '2025-12-31', 'Test Supplier', true
    ]);
    testProduct = { id: productResult.id };

    // Create test warehouse
    const warehouseResult = await runQuery(`
      INSERT INTO warehouses (
        name, code, location, address, city, state, country, 
        capacity, current_usage, manager_id, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING id
    `, [
      'Test Warehouse', 'TW-001', 'Test Location', 'Test Address',
      'Karachi', 'Sindh', 'Pakistan', 1000, 100, adminUser.id, true
    ]);
    testWarehouse = { id: warehouseResult.id };

    // Login to get tokens
    const [adminLogin, gatekeeperLogin, accountantLogin] = await Promise.all([
      request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'testpassword123' }),
      request(app).post('/api/auth/login').send({ email: 'gatekeeper@test.com', password: 'testpassword123' }),
      request(app).post('/api/auth/login').send({ email: 'accountant@test.com', password: 'testpassword123' })
    ]);

    adminToken = adminLogin.body.accessToken;
    gatekeeperToken = gatekeeperLogin.body.accessToken;
    accountantToken = accountantLogin.body.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await runQuery('DELETE FROM audit_logs WHERE user_id IN ($1, $2, $3)', [adminUser.id, gatekeeperUser.id, accountantUser.id]);
    await runQuery('DELETE FROM products WHERE id = $1', [testProduct.id]);
    await runQuery('DELETE FROM warehouses WHERE id = $1', [testWarehouse.id]);
    await runQuery('DELETE FROM users WHERE id IN ($1, $2, $3)', [adminUser.id, gatekeeperUser.id, accountantUser.id]);
  });

  describe('Gatekeeper Audit Logging', () => {
    it('should log gatekeeper stock-in activity', async () => {
      const stockInData = {
        product_id: testProduct.id,
        warehouse_id: testWarehouse.id,
        quantity: 100,
        batch_number: 'BATCH-001',
        vehicle_number: 'KHI-1234',
        driver_name: 'Ahmed Khan',
        source: 'Supplier ABC',
        notes: 'Test stock in'
      };

      const response = await request(app)
        .post('/api/protected/gatekeeper/stock-in')
        .set('Authorization', `Bearer ${gatekeeperToken}`)
        .send(stockInData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify audit log was created
      const auditLogs = await runQuery(`
        SELECT * FROM audit_logs 
        WHERE user_id = $1 AND activity_type = 'gatekeeper_entry' 
        ORDER BY created_at DESC LIMIT 1
      `, [gatekeeperUser.id]);

      expect(auditLogs.length).toBe(1);
      const log = auditLogs[0];
      expect(log.activity_type).toBe('gatekeeper_entry');
      expect(log.activity_category).toBe('stock_movement');
      expect(log.table_name).toBe('stock_movements');
      expect(log.action).toBe('insert');
      expect(log.activity_description).toContain('Gatekeeper recorded in stock movement');
    });

    it('should log gatekeeper stock-out activity', async () => {
      const stockOutData = {
        product_id: testProduct.id,
        warehouse_id: testWarehouse.id,
        quantity: 50,
        batch_number: 'BATCH-001',
        vehicle_number: 'KHI-5678',
        driver_name: 'Hassan Ali',
        destination: 'Customer XYZ',
        notes: 'Test stock out'
      };

      const response = await request(app)
        .post('/api/protected/gatekeeper/stock-out')
        .set('Authorization', `Bearer ${gatekeeperToken}`)
        .send(stockOutData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify audit log was created
      const auditLogs = await runQuery(`
        SELECT * FROM audit_logs 
        WHERE user_id = $1 AND activity_type = 'gatekeeper_entry' 
        ORDER BY created_at DESC LIMIT 1
      `, [gatekeeperUser.id]);

      expect(auditLogs.length).toBe(1);
      const log = auditLogs[0];
      expect(log.activity_type).toBe('gatekeeper_entry');
      expect(log.activity_category).toBe('stock_movement');
      expect(log.table_name).toBe('stock_movements');
      expect(log.action).toBe('insert');
      expect(log.activity_description).toContain('Gatekeeper recorded out stock movement');
    });
  });

  describe('Accountant Audit Logging', () => {
    it('should log accountant purchase creation', async () => {
      const purchaseData = {
        supplier_name: 'Test Supplier',
        supplier_contact: 'John Doe',
        supplier_phone: '+92-300-1234567',
        supplier_email: 'supplier@test.com',
        supplier_address: 'Supplier Address',
        purchase_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [{
          item_name: 'Raw Material',
          item_category: 'ingredients',
          item_description: 'Test raw material',
          unit_of_measure: 'kg',
          quantity: 100,
          unit_price: 50.00,
          tax_rate: 15
        }],
        notes: 'Test purchase'
      };

      const response = await request(app)
        .post('/api/protected/accounting/purchases')
        .set('Authorization', `Bearer ${accountantToken}`)
        .send(purchaseData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify audit log was created
      const auditLogs = await runQuery(`
        SELECT * FROM audit_logs 
        WHERE user_id = $1 AND activity_type = 'accountant_transaction' 
        ORDER BY created_at DESC LIMIT 1
      `, [accountantUser.id]);

      expect(auditLogs.length).toBe(1);
      const log = auditLogs[0];
      expect(log.activity_type).toBe('accountant_transaction');
      expect(log.activity_category).toBe('financial');
      expect(log.table_name).toBe('purchases');
      expect(log.action).toBe('insert');
      expect(log.activity_description).toContain('Accountant created purchase order');
    });

    it('should log accountant expense creation', async () => {
      const expenseData = {
        expense_category: 'utilities',
        expense_type: 'electricity',
        description: 'Monthly electricity bill',
        amount: 5000.00,
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: 'bank_transfer',
        vendor_name: 'K-Electric',
        vendor_contact: 'Billing Department',
        reference_number: 'KE-2024-001',
        notes: 'Monthly utility expense'
      };

      const response = await request(app)
        .post('/api/protected/accounting/expenses')
        .set('Authorization', `Bearer ${accountantToken}`)
        .send(expenseData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify audit log was created
      const auditLogs = await runQuery(`
        SELECT * FROM audit_logs 
        WHERE user_id = $1 AND activity_type = 'accountant_transaction' 
        ORDER BY created_at DESC LIMIT 1
      `, [accountantUser.id]);

      expect(auditLogs.length).toBe(1);
      const log = auditLogs[0];
      expect(log.activity_type).toBe('accountant_transaction');
      expect(log.activity_category).toBe('financial');
      expect(log.table_name).toBe('expenses');
      expect(log.action).toBe('insert');
      expect(log.activity_description).toContain('Accountant recorded expense');
    });
  });

  describe('Field-Level Encryption', () => {
    it('should encrypt sensitive data in audit logs', async () => {
      const purchaseData = {
        supplier_name: 'Sensitive Supplier',
        supplier_contact: 'John Doe',
        supplier_phone: '+92-300-9876543',
        supplier_email: 'sensitive@supplier.com',
        supplier_address: 'Sensitive Address',
        purchase_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [{
          item_name: 'Sensitive Material',
          item_category: 'ingredients',
          item_description: 'Sensitive raw material',
          unit_of_measure: 'kg',
          quantity: 50,
          unit_price: 100.00,
          tax_rate: 15
        }],
        notes: 'Sensitive purchase'
      };

      const response = await request(app)
        .post('/api/protected/accounting/purchases')
        .set('Authorization', `Bearer ${accountantToken}`)
        .send(purchaseData);

      expect(response.status).toBe(200);

      // Check that sensitive data is encrypted in audit log
      const auditLogs = await runQuery(`
        SELECT * FROM audit_logs 
        WHERE user_id = $1 AND activity_type = 'accountant_transaction' 
        ORDER BY created_at DESC LIMIT 1
      `, [accountantUser.id]);

      expect(auditLogs.length).toBe(1);
      const log = auditLogs[0];
      
      // Check that sensitive data is encrypted
      expect(log.sensitive_data).toBeTruthy();
      const sensitiveData = JSON.parse(log.sensitive_data);
      expect(sensitiveData.new).toBeTruthy();
      
      // Check that encrypted fields are marked as [ENCRYPTED]
      const newValues = JSON.parse(log.new_values);
      expect(newValues.supplier_contact).toBe('[ENCRYPTED]');
      expect(newValues.supplier_phone).toBe('[ENCRYPTED]');
      expect(newValues.supplier_email).toBe('[ENCRYPTED]');
      expect(newValues.supplier_address).toBe('[ENCRYPTED]');
    });

    it('should decrypt sensitive data when retrieving audit logs', async () => {
      const auditLogs = await auditService.getAuditLogs({
        activityType: 'accountant_transaction',
        limit: 10
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      
      // Find a log with sensitive data
      const logWithSensitiveData = auditLogs.find(log => 
        log.sensitive_data && JSON.parse(log.sensitive_data).new
      );
      
      if (logWithSensitiveData) {
        const newValues = JSON.parse(logWithSensitiveData.new_values);
        // After decryption, sensitive fields should contain actual values, not [ENCRYPTED]
        expect(newValues.supplier_contact).not.toBe('[ENCRYPTED]');
        expect(newValues.supplier_phone).not.toBe('[ENCRYPTED]');
        expect(newValues.supplier_email).not.toBe('[ENCRYPTED]');
        expect(newValues.supplier_address).not.toBe('[ENCRYPTED]');
      }
    });
  });

  describe('Audit Log Retrieval', () => {
    it('should retrieve audit logs with filters', async () => {
      const response = await request(app)
        .get('/api/protected/audit-logs')
        .query({
          activity_type: 'gatekeeper_entry',
          limit: 10
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.logs).toBeDefined();
      expect(Array.isArray(response.body.data.logs)).toBe(true);
    });

    it('should retrieve audit logs summary', async () => {
      const response = await request(app)
        .get('/api/protected/audit-logs/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.activitySummary).toBeDefined();
      expect(response.body.data.userActivitySummary).toBeDefined();
      expect(response.body.data.dailyTrend).toBeDefined();
    });

    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .get('/api/protected/audit-logs')
        .set('Authorization', `Bearer ${gatekeeperToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Encryption Service', () => {
    it('should encrypt and decrypt data correctly', () => {
      const testData = 'Sensitive information';
      const fieldName = 'supplier_contact';
      const recordId = '123';

      const encrypted = encryptionService.encrypt(testData, fieldName, recordId);
      expect(encrypted).toBeTruthy();
      expect(encrypted.encrypted).toBeTruthy();
      expect(encrypted.salt).toBeTruthy();
      expect(encrypted.iv).toBeTruthy();
      expect(encrypted.tag).toBeTruthy();

      const decrypted = encryptionService.decrypt(encrypted, fieldName, recordId);
      expect(decrypted).toBe(testData);
    });

    it('should handle multiple field encryption', () => {
      const testData = {
        supplier_contact: 'John Doe',
        supplier_phone: '+92-300-1234567',
        supplier_email: 'john@supplier.com',
        supplier_address: '123 Main St',
        public_field: 'This is public'
      };

      const fieldsToEncrypt = ['supplier_contact', 'supplier_phone', 'supplier_email', 'supplier_address'];
      const recordId = '456';

      const { encrypted, sensitiveData } = encryptionService.encryptFields(testData, fieldsToEncrypt, recordId);

      // Check that sensitive fields are marked as encrypted
      expect(encrypted.supplier_contact).toBe('[ENCRYPTED]');
      expect(encrypted.supplier_phone).toBe('[ENCRYPTED]');
      expect(encrypted.supplier_email).toBe('[ENCRYPTED]');
      expect(encrypted.supplier_address).toBe('[ENCRYPTED]');
      expect(encrypted.public_field).toBe('This is public');

      // Check that sensitive data contains encrypted values
      expect(sensitiveData.supplier_contact).toBeTruthy();
      expect(sensitiveData.supplier_phone).toBeTruthy();
      expect(sensitiveData.supplier_email).toBeTruthy();
      expect(sensitiveData.supplier_address).toBeTruthy();
    });
  });
});
