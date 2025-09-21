-- ERP System Seed Data
-- Sample data for development and testing

-- =============================================
-- ROLES SEED DATA
-- =============================================
INSERT INTO roles (id, name, slug, description, permissions, is_active, created_at, updated_at) VALUES
(1, 'Super Admin', 'super-admin', 'Full system access with all permissions', 
 '["users.create", "users.read", "users.update", "users.delete", "products.create", "products.read", "products.update", "products.delete", "warehouses.create", "warehouses.read", "warehouses.update", "warehouses.delete", "invoices.create", "invoices.read", "invoices.update", "invoices.delete", "reports.read", "settings.update"]', 
 true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Admin', 'admin', 'Administrative access with most permissions', 
 '["users.create", "users.read", "users.update", "products.create", "products.read", "products.update", "products.delete", "warehouses.create", "warehouses.read", "warehouses.update", "invoices.create", "invoices.read", "invoices.update", "invoices.delete", "reports.read"]', 
 true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Manager', 'manager', 'Management access with operational permissions', 
 '["users.read", "products.create", "products.read", "products.update", "warehouses.read", "invoices.create", "invoices.read", "invoices.update", "reports.read"]', 
 true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'User', 'user', 'Basic user access with limited permissions', 
 '["products.read", "warehouses.read", "invoices.read"]', 
 true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'Sales Representative', 'sales-rep', 'Sales team member with sales permissions', 
 '["products.read", "warehouses.read", "invoices.create", "invoices.read", "invoices.update", "reports.read"]', 
 true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =============================================
-- USERS SEED DATA
-- =============================================
-- Note: Passwords are hashed with bcrypt (salt rounds: 12)
-- admin123, manager123, user123
INSERT INTO users (id, name, email, password, role, phone, address, is_active, last_login, created_at, updated_at) VALUES
(1, 'Super Admin', 'admin@erp.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QzK8iK', 'admin', '+1-555-0101', '123 Admin Street, Tech City, TC 12345', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'John Manager', 'manager@erp.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', '+1-555-0102', '456 Manager Avenue, Business District, BD 67890', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Jane Sales', 'sales@erp.com', '$2a$12$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'user', '+1-555-0103', '789 Sales Road, Commerce Park, CP 11111', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =============================================
-- WAREHOUSES SEED DATA
-- =============================================
INSERT INTO warehouses (id, name, code, address, city, state, country, postal_code, phone, email, manager_id, capacity, capacity_unit, is_active, created_at, updated_at) VALUES
(1, 'Main Warehouse', 'WH001', '100 Industrial Blvd', 'Tech City', 'California', 'USA', '90210', '+1-555-1001', 'main@warehouse.com', 2, 50000.00, 'sqft', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Secondary Warehouse', 'WH002', '200 Distribution Drive', 'Business District', 'California', 'USA', '90211', '+1-555-1002', 'secondary@warehouse.com', 2, 30000.00, 'sqft', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =============================================
-- UNITS OF MEASURE SEED DATA
-- =============================================
INSERT INTO units_of_measure (id, name, symbol, type, conversion_factor, base_unit, description, is_active, created_at, updated_at) VALUES
(1, 'Grams', 'g', 'weight', 1.0000, 'grams', 'Metric unit of weight measurement', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Kilograms', 'kg', 'weight', 1000.0000, 'grams', 'Metric unit of weight measurement (1000 grams)', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Packets', 'pkt', 'count', 1.0000, 'packets', 'Individual packet units', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'Cartons', 'ctn', 'count', 1.0000, 'cartons', 'Carton packaging units', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'Boxes', 'box', 'count', 1.0000, 'boxes', 'Box packaging units', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 'Bags', 'bag', 'count', 1.0000, 'bags', 'Bag packaging units', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 'Litres', 'L', 'volume', 1.0000, 'litres', 'Metric unit of volume measurement', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 'Millilitres', 'ml', 'volume', 0.0010, 'litres', 'Metric unit of volume measurement (1/1000 litre)', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =============================================
-- PRODUCTS SEED DATA (Pakasian Foods)
-- =============================================
INSERT INTO products (id, name, sku, barcode, description, category, brand, unit, cost_price, selling_price, min_stock_level, max_stock_level, weight, weight_unit, length, width, height, dimension_unit, batch_number, expiry_date, supplier_name, unit_of_measure_id, product_category, flavor, packaging_type, net_weight, gross_weight, nutrition_info, ingredients, allergen_info, storage_conditions, origin_country, manufacturing_date, is_perishable, requires_cold_storage, shelf_life_days, attributes, image_url, is_active, is_taxable, tax_rate, created_at, updated_at) VALUES
(1, 'Protein Nimko 100g', 'PKF-PN-100G-001', '1234567890123', 'Premium protein-rich nimko snack with mixed nuts and spices, 100g packet', 'Snacks', 'Pakasian Foods', 'pkt', 25.00, 35.00, 50.00, 500.00, 100.000, 'g', 20.0, 15.0, 3.0, 'cm', 'PKF-PN-100G-2024-001', '2025-06-15', 'Pakasian Foods Ltd', 1, 'snacks', 'mixed', 'bag', 100.000, 105.000, 'Protein: 15g, Carbs: 45g, Fat: 25g per 100g', 'Mixed nuts, chickpea flour, spices, salt, oil, preservatives', 'Contains nuts, gluten', 'Store in cool, dry place', 'Pakistan', '2024-01-15', true, false, 365, 
 '{"protein_content": "15g per 100g", "spice_level": "medium", "nut_mix": "almonds, cashews, peanuts", "packaging_material": "foil bag", "certification": "HALAL"}', 
 '/images/products/protein-nimko-100g.jpg', true, true, 17.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(2, 'Protein Nimko 250g', 'PKF-PN-250G-002', '1234567890124', 'Premium protein-rich nimko snack with mixed nuts and spices, 250g family pack', 'Snacks', 'Pakasian Foods', 'pkt', 55.00, 75.00, 30.00, 300.00, 250.000, 'g', 25.0, 18.0, 4.0, 'cm', 'PKF-PN-250G-2024-001', '2025-06-15', 'Pakasian Foods Ltd', 1, 'snacks', 'mixed', 'bag', 250.000, 260.000, 'Protein: 15g, Carbs: 45g, Fat: 25g per 100g', 'Mixed nuts, chickpea flour, spices, salt, oil, preservatives', 'Contains nuts, gluten', 'Store in cool, dry place', 'Pakistan', '2024-01-15', true, false, 365, 
 '{"protein_content": "15g per 100g", "spice_level": "medium", "nut_mix": "almonds, cashews, peanuts", "packaging_material": "foil bag", "certification": "HALAL", "family_pack": true}', 
 '/images/products/protein-nimko-250g.jpg', true, true, 17.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(3, 'Spicy Nimko Mix', 'PKF-SNM-150G-003', '1234567890125', 'Spicy mixed nimko with extra chili and traditional Pakistani spices, 150g packet', 'Snacks', 'Pakasian Foods', 'pkt', 30.00, 42.00, 40.00, 400.00, 150.000, 'g', 22.0, 16.0, 3.5, 'cm', 'PKF-SNM-150G-2024-001', '2025-05-20', 'Pakasian Foods Ltd', 1, 'snacks', 'spicy', 'bag', 150.000, 158.000, 'Protein: 12g, Carbs: 50g, Fat: 22g per 100g', 'Mixed nuts, chickpea flour, red chili, spices, salt, oil, preservatives', 'Contains nuts, gluten, chili', 'Store in cool, dry place', 'Pakistan', '2024-01-20', true, false, 300, 
 '{"spice_level": "high", "chili_content": "extra", "traditional_spices": "garam masala, cumin, coriander", "packaging_material": "foil bag", "certification": "HALAL", "heat_level": "5/5"}', 
 '/images/products/spicy-nimko-mix.jpg', true, true, 17.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(4, 'Salted Chips 50g', 'PKF-SC-50G-004', '1234567890126', 'Crispy salted potato chips with traditional Pakistani seasoning, 50g packet', 'Snacks', 'Pakasian Foods', 'pkt', 15.00, 22.00, 100.00, 1000.00, 50.000, 'g', 18.0, 12.0, 2.5, 'cm', 'PKF-SC-50G-2024-001', '2024-12-31', 'Pakasian Foods Ltd', 1, 'snacks', 'salted', 'bag', 50.000, 52.000, 'Protein: 3g, Carbs: 35g, Fat: 15g per 100g', 'Potatoes, palm oil, salt, spices, preservatives', 'May contain traces of nuts', 'Store in cool, dry place', 'Pakistan', '2024-01-10', true, false, 180, 
 '{"potato_type": "local", "oil_type": "palm oil", "seasoning": "traditional Pakistani", "packaging_material": "foil bag", "certification": "HALAL", "crispiness": "extra crispy"}', 
 '/images/products/salted-chips-50g.jpg', true, true, 17.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(5, 'Salted Chips 100g', 'PKF-SC-100G-005', '1234567890127', 'Crispy salted potato chips with traditional Pakistani seasoning, 100g family pack', 'Snacks', 'Pakasian Foods', 'pkt', 28.00, 40.00, 50.00, 500.00, 100.000, 'g', 22.0, 15.0, 3.0, 'cm', 'PKF-SC-100G-2024-001', '2024-12-31', 'Pakasian Foods Ltd', 1, 'snacks', 'salted', 'bag', 100.000, 105.000, 'Protein: 3g, Carbs: 35g, Fat: 15g per 100g', 'Potatoes, palm oil, salt, spices, preservatives', 'May contain traces of nuts', 'Store in cool, dry place', 'Pakistan', '2024-01-10', true, false, 180, 
 '{"potato_type": "local", "oil_type": "palm oil", "seasoning": "traditional Pakistani", "packaging_material": "foil bag", "certification": "HALAL", "crispiness": "extra crispy", "family_pack": true}', 
 '/images/products/salted-chips-100g.jpg', true, true, 17.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =============================================
-- SAMPLE STOCK MOVEMENTS
-- =============================================
INSERT INTO stock_movements (id, movement_type, reference_type, reference_id, product_id, warehouse_id, quantity, unit_cost, total_cost, notes, created_by, movement_date, created_at, updated_at) VALUES
(1, 'in', 'purchase', 'PO-2024-001', 1, 1, 10.000, 1200.00, 12000.00, 'Initial stock purchase', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'in', 'purchase', 'PO-2024-002', 2, 1, 50.000, 45.00, 2250.00, 'Mouse stock purchase', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'in', 'purchase', 'PO-2024-003', 3, 1, 5.000, 800.00, 4000.00, 'Office chair purchase', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'in', 'purchase', 'PO-2024-004', 4, 2, 15.000, 350.00, 5250.00, 'Monitor stock for secondary warehouse', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'in', 'purchase', 'PO-2024-005', 5, 1, 25.000, 120.00, 3000.00, 'Desk lamp purchase', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =============================================
-- SAMPLE INVOICES
-- =============================================
INSERT INTO invoices (id, invoice_number, invoice_type, status, customer_id, warehouse_id, subtotal, tax_amount, discount_amount, total_amount, paid_amount, balance_amount, invoice_date, due_date, notes, created_by, created_at, updated_at) VALUES
(1, 'INV-2024-001', 'sales', 'paid', 3, 1, 1499.99, 127.50, 0.00, 1627.49, 1627.49, 0.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'Laptop sale to customer', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'INV-2024-002', 'sales', 'pending', 3, 1, 79.99, 6.80, 0.00, 86.79, 0.00, 86.79, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'Mouse sale', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =============================================
-- SAMPLE INVOICE ITEMS
-- =============================================
INSERT INTO invoice_items (id, invoice_id, product_id, quantity, unit_price, discount_percentage, discount_amount, tax_percentage, tax_amount, line_total, description, created_at, updated_at) VALUES
(1, 1, 1, 1.000, 1499.99, 0.00, 0.00, 8.50, 127.50, 1627.49, 'Dell XPS 13 Laptop', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 2, 2, 1.000, 79.99, 0.00, 0.00, 8.50, 6.80, 86.79, 'Logitech MX Master 3 Mouse', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =============================================
-- SAMPLE LEDGER ENTRIES
-- =============================================
INSERT INTO ledger_entries (id, entry_type, account_code, account_name, amount, reference_type, reference_id, description, entry_date, created_by, created_at, updated_at) VALUES
(1, 'debit', '1200', 'Accounts Receivable', 1627.49, 'invoice', 'INV-2024-001', 'Sales invoice INV-2024-001', CURRENT_DATE, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'credit', '4000', 'Sales Revenue', 1499.99, 'invoice', 'INV-2024-001', 'Sales revenue from INV-2024-001', CURRENT_DATE, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'credit', '2200', 'Sales Tax Payable', 127.50, 'invoice', 'INV-2024-001', 'Sales tax from INV-2024-001', CURRENT_DATE, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =============================================
-- SAMPLE AUDIT LOGS
-- =============================================
INSERT INTO audit_logs (id, table_name, record_id, action, old_values, new_values, changed_fields, user_id, ip_address, user_agent, created_at) VALUES
(1, 'users', '1', 'insert', NULL, '{"name": "Super Admin", "email": "admin@erp.com", "role": "admin"}', 'name,email,role', 1, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', CURRENT_TIMESTAMP),
(2, 'products', '1', 'insert', NULL, '{"name": "Laptop Computer - Dell XPS 13", "sku": "LAP-DELL-XPS13-001"}', 'name,sku', 1, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', CURRENT_TIMESTAMP);

-- =============================================
-- SAMPLE CHANGE LOGS (FOR SYNC)
-- =============================================
INSERT INTO change_logs (id, entity_type, entity_id, change_type, change_data, sync_status, sync_target, created_by, created_at, updated_at) VALUES
(1, 'product', '1', 'create', '{"sku": "LAP-DELL-XPS13-001", "name": "Laptop Computer - Dell XPS 13"}', 'pending', 'external_system_1', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'user', '1', 'create', '{"email": "admin@erp.com", "name": "Super Admin"}', 'synced', 'external_system_1', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'invoice', '1', 'create', '{"invoice_number": "INV-2024-001", "total_amount": 1627.49}', 'pending', 'accounting_system', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =============================================
-- RESET SEQUENCES (PostgreSQL)
-- =============================================
-- Reset auto-increment sequences to continue from the highest ID
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));
SELECT setval('warehouses_id_seq', (SELECT MAX(id) FROM warehouses));
SELECT setval('units_of_measure_id_seq', (SELECT MAX(id) FROM units_of_measure));
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT setval('stock_movements_id_seq', (SELECT MAX(id) FROM stock_movements));
SELECT setval('invoices_id_seq', (SELECT MAX(id) FROM invoices));
SELECT setval('invoice_items_id_seq', (SELECT MAX(id) FROM invoice_items));
SELECT setval('ledger_entries_id_seq', (SELECT MAX(id) FROM ledger_entries));
SELECT setval('audit_logs_id_seq', (SELECT MAX(id) FROM audit_logs));
SELECT setval('change_logs_id_seq', (SELECT MAX(id) FROM change_logs));
