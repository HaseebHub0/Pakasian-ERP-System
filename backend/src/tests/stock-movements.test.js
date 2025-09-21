const request = require('supertest');
const app = require('../index');
const { initializeDatabase, runQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

describe('Stock Movement Endpoints for Gatekeeper', () => {
  let gatekeeperToken;
  let gatekeeperUser;
  let testProduct;
  let testWarehouse;

  beforeAll(async () => {
    await initializeDatabase();
    const hashedPassword = await bcrypt.hash('testpassword123', 12);

    // Create test gatekeeper user
    const userResult = await runQuery(
      'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      ['Test Gatekeeper', 'gatekeeper@test.com', hashedPassword, 'gatekeeper', true]
    );
    gatekeeperUser = { id: userResult.id, email: 'gatekeeper@test.com', role: 'gatekeeper' };

    // Create test product
    const productResult = await runQuery(`
      INSERT INTO products (
        name, sku, barcode, description, category, brand, unit_of_measure, 
        cost_price, selling_price, min_stock_level, current_stock, 
        batch_number, expiry_date, supplier_name, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
      RETURNING id
    `, [
      'Test Product', 'TEST-001', '123456789', 'Test product for stock movements',
      'Snacks', 'Pakasian Foods', 'pkt', 10.00, 15.00, 10, 100,
      'TEST-BATCH-001', '2025-12-31', 'Test Supplier', true
    ]);
    testProduct = { id: productResult.id };

    // Create test warehouse
    const warehouseResult = await runQuery(`
      INSERT INTO warehouses (name, location, capacity, current_stock, is_active) 
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, ['Test Warehouse', 'Test Location', 1000, 0, true]);
    testWarehouse = { id: warehouseResult.id };

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'gatekeeper@test.com', password: 'testpassword123' });
    
    gatekeeperToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await runQuery('DELETE FROM stock_movements WHERE created_by = $1', [gatekeeperUser.id]);
    await runQuery('DELETE FROM products WHERE id = $1', [testProduct.id]);
    await runQuery('DELETE FROM warehouses WHERE id = $1', [testWarehouse.id]);
    await runQuery('DELETE FROM users WHERE id = $1', [gatekeeperUser.id]);
  });

  describe('POST /api/protected/gatekeeper/stock-in', () => {
    it('should record inbound stock movement successfully', async () => {
      const stockInData = {
        product_id: testProduct.id,
        warehouse_id: testWarehouse.id,
        quantity: 50,
        batch_number: 'BATCH-IN-001',
        vehicle_number: 'KHI-1234',
        driver_name: 'Ahmed Khan',
        source: 'Test Supplier',
        unit_cost: 10.50,
        notes: 'Test inbound movement'
      };

      const response = await request(app)
        .post('/api/protected/gatekeeper/stock-in')
        .set('Authorization', `Bearer ${gatekeeperToken}`)
        .send(stockInData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.movementId).toBeDefined();
      expect(response.body.gatePassNumber).toMatch(/^GP-IN-/);
      expect(response.body.data.quantity).toBe(50);
      expect(response.body.data.batch_number).toBe('BATCH-IN-001');
      expect(response.body.data.vehicle_number).toBe('KHI-1234');
      expect(response.body.data.driver_name).toBe('Ahmed Khan');
    });

    it('should reject stock-in with missing required fields', async () => {
      const incompleteData = {
        product_id: testProduct.id,
        quantity: 50
        // Missing: warehouse_id, batch_number, vehicle_number, driver_name
      };

      const response = await request(app)
        .post('/api/protected/gatekeeper/stock-in')
        .set('Authorization', `Bearer ${gatekeeperToken}`)
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should reject stock-in without authentication', async () => {
      const response = await request(app)
        .post('/api/protected/gatekeeper/stock-in')
        .send({
          product_id: testProduct.id,
          warehouse_id: testWarehouse.id,
          quantity: 50,
          batch_number: 'BATCH-IN-002',
          vehicle_number: 'KHI-5678',
          driver_name: 'Hassan Ali'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/protected/gatekeeper/stock-out', () => {
    it('should record outbound stock movement successfully', async () => {
      const stockOutData = {
        product_id: testProduct.id,
        warehouse_id: testWarehouse.id,
        quantity: 25,
        batch_number: 'BATCH-OUT-001',
        vehicle_number: 'KHI-9012',
        driver_name: 'Usman Khan',
        destination: 'Test Customer',
        unit_cost: 12.00,
        notes: 'Test outbound movement'
      };

      const response = await request(app)
        .post('/api/protected/gatekeeper/stock-out')
        .set('Authorization', `Bearer ${gatekeeperToken}`)
        .send(stockOutData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.movementId).toBeDefined();
      expect(response.body.gatePassNumber).toMatch(/^GP-OUT-/);
      expect(response.body.data.quantity).toBe(25);
      expect(response.body.data.batch_number).toBe('BATCH-OUT-001');
      expect(response.body.data.vehicle_number).toBe('KHI-9012');
      expect(response.body.data.driver_name).toBe('Usman Khan');
      expect(response.body.data.destination).toBe('Test Customer');
    });

    it('should reject stock-out with missing required fields', async () => {
      const incompleteData = {
        product_id: testProduct.id,
        quantity: 25
        // Missing: warehouse_id, batch_number, vehicle_number, driver_name
      };

      const response = await request(app)
        .post('/api/protected/gatekeeper/stock-out')
        .set('Authorization', `Bearer ${gatekeeperToken}`)
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });
  });

  describe('GET /api/protected/gatekeeper/gate-pass/:movementId', () => {
    let testMovementId;

    beforeAll(async () => {
      // Create a test movement for PDF generation
      const result = await runQuery(`
        INSERT INTO stock_movements (
          movement_type, reference_type, reference_id, product_id, warehouse_id,
          quantity, batch_number, vehicle_number, driver_name, gate_pass_number,
          entry_time, source, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `, [
        'in', 'gatekeeper_entry', 'TEST-REF-001', testProduct.id, testWarehouse.id,
        30, 'BATCH-PDF-001', 'KHI-PDF-001', 'PDF Test Driver', 'GP-PDF-001',
        new Date(), 'PDF Test Source', gatekeeperUser.id
      ]);
      testMovementId = result.id;
    });

    it('should generate PDF gate pass successfully', async () => {
      const response = await request(app)
        .get(`/api/protected/gatekeeper/gate-pass/${testMovementId}`)
        .set('Authorization', `Bearer ${gatekeeperToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('gate-pass-');
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should reject PDF generation for non-existent movement', async () => {
      const response = await request(app)
        .get('/api/protected/gatekeeper/gate-pass/99999')
        .set('Authorization', `Bearer ${gatekeeperToken}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Movement not found');
    });

    it('should reject PDF generation without authentication', async () => {
      const response = await request(app)
        .get(`/api/protected/gatekeeper/gate-pass/${testMovementId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Role-based Access Control', () => {
    let adminToken, accountantToken, directorToken;

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

      const directorResult = await runQuery(
        'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['Test Director', 'director@test.com', hashedPassword, 'director', true]
      );

      // Login to get tokens
      const [adminLogin, accountantLogin, directorLogin] = await Promise.all([
        request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'testpassword123' }),
        request(app).post('/api/auth/login').send({ email: 'accountant@test.com', password: 'testpassword123' }),
        request(app).post('/api/auth/login').send({ email: 'director@test.com', password: 'testpassword123' })
      ]);

      adminToken = adminLogin.body.accessToken;
      accountantToken = accountantLogin.body.accessToken;
      directorToken = directorLogin.body.accessToken;
    });

    afterAll(async () => {
      // Clean up test users
      await runQuery('DELETE FROM users WHERE email IN ($1, $2, $3)', ['admin@test.com', 'accountant@test.com', 'director@test.com']);
    });

    it('should allow admin to access stock movement endpoints', async () => {
      const response = await request(app)
        .post('/api/protected/gatekeeper/stock-in')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          product_id: testProduct.id,
          warehouse_id: testWarehouse.id,
          quantity: 10,
          batch_number: 'ADMIN-TEST-001',
          vehicle_number: 'ADMIN-001',
          driver_name: 'Admin Test Driver'
        });

      expect(response.status).toBe(200);
    });

    it('should deny accountant access to stock movement endpoints', async () => {
      const response = await request(app)
        .post('/api/protected/gatekeeper/stock-in')
        .set('Authorization', `Bearer ${accountantToken}`)
        .send({
          product_id: testProduct.id,
          warehouse_id: testWarehouse.id,
          quantity: 10,
          batch_number: 'ACCOUNTANT-TEST-001',
          vehicle_number: 'ACCOUNTANT-001',
          driver_name: 'Accountant Test Driver'
        });

      expect(response.status).toBe(403);
    });

    it('should deny director access to stock movement endpoints', async () => {
      const response = await request(app)
        .post('/api/protected/gatekeeper/stock-in')
        .set('Authorization', `Bearer ${directorToken}`)
        .send({
          product_id: testProduct.id,
          warehouse_id: testWarehouse.id,
          quantity: 10,
          batch_number: 'DIRECTOR-TEST-001',
          vehicle_number: 'DIRECTOR-001',
          driver_name: 'Director Test Driver'
        });

      expect(response.status).toBe(403);
    });
  });
});
