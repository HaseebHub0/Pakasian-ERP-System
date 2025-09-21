const request = require('supertest');
const app = require('../index');
const { initializeDatabase, query, runQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

describe('Products API', () => {
  let adminToken, storekeeperToken;
  let testProduct;

  beforeAll(async () => {
    // Initialize test database
    await initializeDatabase();
    
    // Create test admin user
    const hashedPassword = await bcrypt.hash('testpassword123', 12);
    const adminResult = await runQuery(
      'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5)',
      ['Test Admin', 'admin@test.com', hashedPassword, 'admin', true]
    );

    // Create test storekeeper user
    const storekeeperResult = await runQuery(
      'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5)',
      ['Test Storekeeper', 'storekeeper@test.com', hashedPassword, 'storekeeper', true]
    );

    // Login to get tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'testpassword123'
      });
    adminToken = adminLogin.body.accessToken;

    const storekeeperLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'storekeeper@test.com',
        password: 'testpassword123'
      });
    storekeeperToken = storekeeperLogin.body.accessToken;

    // Create test product
    const productResult = await runQuery(
      `INSERT INTO products (
        name, sku, barcode, description, category, brand, unit, 
        cost_price, selling_price, min_stock_level, max_stock_level,
        weight, weight_unit, batch_number, expiry_date, supplier_name,
        product_category, flavor, packaging_type, net_weight, gross_weight,
        nutrition_info, ingredients, allergen_info, storage_conditions,
        origin_country, manufacturing_date, is_perishable, requires_cold_storage,
        shelf_life_days, is_active, is_taxable, tax_rate
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)`,
      [
        'Test Protein Nimko', 'TEST-PN-100G', '9999999999999', 'Test product description',
        'Snacks', 'Test Brand', 'pkt', 25.00, 35.00, 10.00, 100.00,
        100.000, 'g', 'TEST-2024-001', '2025-12-31', 'Test Supplier',
        'snacks', 'mixed', 'bag', 100.000, 105.000,
        'Test nutrition info', 'Test ingredients', 'Test allergens',
        'Store in cool place', 'Pakistan', '2024-01-01', true, false,
        365, true, true, 17.00
      ]
    );
    testProduct = { id: productResult.id, sku: 'TEST-PN-100G' };
  });

  afterAll(async () => {
    // Cleanup test data
    await runQuery('DELETE FROM products WHERE sku = $1', ['TEST-PN-100G']);
    await runQuery('DELETE FROM users WHERE email IN ($1, $2)', ['admin@test.com', 'storekeeper@test.com']);
  });

  describe('GET /api/protected/inventory/products', () => {
    it('should allow storekeeper to view products', async () => {
      const response = await request(app)
        .get('/api/protected/inventory/products')
        .set('Authorization', `Bearer ${storekeeperToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Product inventory');
      expect(response.body).toHaveProperty('data');
    });

    it('should deny non-storekeeper users access', async () => {
      // Create a test accountant user
      const hashedPassword = await bcrypt.hash('testpassword123', 12);
      const accountantResult = await runQuery(
        'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5)',
        ['Test Accountant', 'accountant@test.com', hashedPassword, 'accountant', true]
      );

      const accountantLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'accountant@test.com',
          password: 'testpassword123'
        });

      const response = await request(app)
        .get('/api/protected/inventory/products')
        .set('Authorization', `Bearer ${accountantLogin.body.accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');

      // Cleanup
      await runQuery('DELETE FROM users WHERE id = $1', [accountantResult.id]);
    });
  });

  describe('Product Model Features', () => {
    it('should have Pakasian Foods products in database', async () => {
      const products = await query(
        'SELECT name, sku, brand, product_category, flavor, batch_number, expiry_date, supplier_name FROM products WHERE brand = $1',
        ['Pakasian Foods']
      );

      expect(products.length).toBeGreaterThan(0);
      
      // Check for specific products
      const productNames = products.map(p => p.name);
      expect(productNames).toContain('Protein Nimko 100g');
      expect(productNames).toContain('Protein Nimko 250g');
      expect(productNames).toContain('Spicy Nimko Mix');
      expect(productNames).toContain('Salted Chips 50g');
      expect(productNames).toContain('Salted Chips 100g');
    });

    it('should have units of measure data', async () => {
      const units = await query(
        'SELECT name, symbol, type FROM units_of_measure WHERE is_active = true ORDER BY name'
      );

      expect(units.length).toBeGreaterThan(0);
      
      const unitNames = units.map(u => u.name);
      expect(unitNames).toContain('Grams');
      expect(unitNames).toContain('Packets');
      expect(unitNames).toContain('Cartons');
    });

    it('should have products with food-specific fields', async () => {
      const product = await query(
        'SELECT name, batch_number, expiry_date, supplier_name, product_category, flavor, packaging_type, net_weight, gross_weight, nutrition_info, ingredients, allergen_info, storage_conditions, origin_country, manufacturing_date, is_perishable, requires_cold_storage, shelf_life_days FROM products WHERE sku = $1',
        ['PKF-PN-100G-001']
      );

      expect(product).toBeTruthy();
      expect(product.batch_number).toBe('PKF-PN-100G-2024-001');
      expect(product.expiry_date).toBeTruthy();
      expect(product.supplier_name).toBe('Pakasian Foods Ltd');
      expect(product.product_category).toBe('snacks');
      expect(product.flavor).toBe('mixed');
      expect(product.packaging_type).toBe('bag');
      expect(product.net_weight).toBe(100.000);
      expect(product.gross_weight).toBe(105.000);
      expect(product.nutrition_info).toBeTruthy();
      expect(product.ingredients).toBeTruthy();
      expect(product.allergen_info).toBeTruthy();
      expect(product.storage_conditions).toBeTruthy();
      expect(product.origin_country).toBe('Pakistan');
      expect(product.manufacturing_date).toBeTruthy();
      expect(product.is_perishable).toBe(true);
      expect(product.requires_cold_storage).toBe(false);
      expect(product.shelf_life_days).toBe(365);
    });

    it('should have products with proper SKU format', async () => {
      const products = await query(
        'SELECT sku FROM products WHERE brand = $1',
        ['Pakasian Foods']
      );

      products.forEach(product => {
        expect(product.sku).toMatch(/^PKF-/); // Should start with PKF-
      });
    });

    it('should have products with realistic pricing', async () => {
      const products = await query(
        'SELECT name, cost_price, selling_price FROM products WHERE brand = $1',
        ['Pakasian Foods']
      );

      products.forEach(product => {
        expect(product.cost_price).toBeGreaterThan(0);
        expect(product.selling_price).toBeGreaterThan(product.cost_price);
        expect(product.selling_price).toBeLessThan(100); // Reasonable for snacks
      });
    });

    it('should have products with proper expiry dates', async () => {
      const products = await query(
        'SELECT name, expiry_date, manufacturing_date, shelf_life_days FROM products WHERE brand = $1',
        ['Pakasian Foods']
      );

      products.forEach(product => {
        expect(product.expiry_date).toBeTruthy();
        expect(product.manufacturing_date).toBeTruthy();
        expect(product.shelf_life_days).toBeGreaterThan(0);
        expect(product.shelf_life_days).toBeLessThan(1000); // Reasonable shelf life
      });
    });

    it('should have products with nutritional information', async () => {
      const products = await query(
        'SELECT name, nutrition_info, ingredients, allergen_info FROM products WHERE brand = $1',
        ['Pakasian Foods']
      );

      products.forEach(product => {
        expect(product.nutrition_info).toBeTruthy();
        expect(product.ingredients).toBeTruthy();
        expect(product.allergen_info).toBeTruthy();
        expect(product.nutrition_info.length).toBeGreaterThan(10);
        expect(product.ingredients.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Product Search and Filtering', () => {
    it('should be able to search products by flavor', async () => {
      const spicyProducts = await query(
        'SELECT name, flavor FROM products WHERE flavor = $1',
        ['spicy']
      );

      expect(spicyProducts.length).toBeGreaterThan(0);
      expect(spicyProducts[0].name).toContain('Spicy');
    });

    it('should be able to filter products by category', async () => {
      const snackProducts = await query(
        'SELECT name, product_category FROM products WHERE product_category = $1',
        ['snacks']
      );

      expect(snackProducts.length).toBeGreaterThan(0);
      snackProducts.forEach(product => {
        expect(product.product_category).toBe('snacks');
      });
    });

    it('should be able to filter products by supplier', async () => {
      const pakasianProducts = await query(
        'SELECT name, supplier_name FROM products WHERE supplier_name = $1',
        ['Pakasian Foods Ltd']
      );

      expect(pakasianProducts.length).toBeGreaterThan(0);
      pakasianProducts.forEach(product => {
        expect(product.supplier_name).toBe('Pakasian Foods Ltd');
      });
    });

    it('should be able to find products by batch number', async () => {
      const batchProducts = await query(
        'SELECT name, batch_number FROM products WHERE batch_number LIKE $1',
        ['PKF-%']
      );

      expect(batchProducts.length).toBeGreaterThan(0);
      batchProducts.forEach(product => {
        expect(product.batch_number).toMatch(/^PKF-/);
      });
    });
  });
});
