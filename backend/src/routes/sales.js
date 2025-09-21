const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, runQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

// Get sales - Accountants can see all, others read-only
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0, start_date, end_date } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (start_date) {
      whereClause += ` AND s.sale_date >= $${paramCount++}`;
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ` AND s.sale_date <= $${paramCount++}`;
      params.push(end_date);
    }

    const sales = await query(
      `SELECT s.*, u.name as created_by_name, c.name as customer_name
       FROM sales s
       LEFT JOIN users u ON s.created_by = u.id
       LEFT JOIN customers c ON s.customer_id = c.id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      [...params, limit, offset]
    );

    res.json({ sales });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create sale
router.post('/', [
  authenticateToken,
  requirePermission('sales:create'),
  body('customer_id').isInt().withMessage('Customer ID is required'),
  body('sale_date').isISO8601().withMessage('Valid sale date is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product_id').isInt().withMessage('Product ID is required for each item'),
  body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Unit price must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { customer_id, sale_date, items, notes, payment_method } = req.body;

    // Verify customer exists
    const customer = await query('SELECT id, name FROM customers WHERE id = $1', [customer_id]);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Calculate total
    let total = 0;
    for (const item of items) {
      total += item.quantity * item.unit_price;
    }

    // Create sale
    const saleResult = await runQuery(
      `INSERT INTO sales (customer_id, sale_date, total_amount, notes, payment_method, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [customer_id, sale_date, total, notes, payment_method, req.user.id]
    );

    // Create sale items
    for (const item of items) {
      await runQuery(
        `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [saleResult.id, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
      );

      // Update stock
      await runQuery(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    res.status(201).json({
      message: 'Sale created successfully',
      id: saleResult.id,
      total
    });
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get sale by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const sale = await query(
      `SELECT s.*, u.name as created_by_name, c.name as customer_name
       FROM sales s
       LEFT JOIN users u ON s.created_by = u.id
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.id = $1`,
      [id]
    );

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Get sale items
    const items = await query(
      `SELECT si.*, p.name as product_name
       FROM sale_items si
       LEFT JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = $1`,
      [id]
    );

    res.json({ 
      sale: {
        ...sale,
        items
      }
    });
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update sale
router.put('/:id', [
  authenticateToken,
  requirePermission('sales:update'),
  body('customer_id').optional().isInt().withMessage('Customer ID must be integer'),
  body('sale_date').optional().isISO8601().withMessage('Valid sale date is required'),
  body('items').optional().isArray({ min: 1 }).withMessage('At least one item is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { customer_id, sale_date, items, notes, payment_method } = req.body;

    // Check if sale exists
    const existingSale = await query('SELECT * FROM sales WHERE id = $1', [id]);
    if (!existingSale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Update sale
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (customer_id) {
      updates.push(`customer_id = $${paramCount++}`);
      values.push(customer_id);
    }

    if (sale_date) {
      updates.push(`sale_date = $${paramCount++}`);
      values.push(sale_date);
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes);
    }

    if (payment_method) {
      updates.push(`payment_method = $${paramCount++}`);
      values.push(payment_method);
    }

    if (updates.length > 0) {
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);
      
      await runQuery(
        `UPDATE sales SET ${updates.join(', ')} WHERE id = $${paramCount}`,
        values
      );
    }

    res.json({ message: 'Sale updated successfully' });
  } catch (error) {
    console.error('Error updating sale:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
