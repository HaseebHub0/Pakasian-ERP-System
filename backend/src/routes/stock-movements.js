const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, runQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission, requireOwnership } = require('../middleware/rbac');

const router = express.Router();

// Get stock movements - Gatekeepers see only their own entries
router.get('/', authenticateToken, requireOwnership, async (req, res) => {
  try {
    const { start_date, end_date, movement_type, limit = 50, offset = 0 } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 1;

    // Gatekeepers can only see their own entries
    if (req.user.role === 'gatekeeper') {
      whereClause += ` AND sm.created_by = $${paramCount++}`;
      params.push(req.user.id);
    }

    if (start_date) {
      whereClause += ` AND DATE(sm.movement_date) >= $${paramCount++}`;
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ` AND DATE(sm.movement_date) <= $${paramCount++}`;
      params.push(end_date);
    }

    if (movement_type) {
      whereClause += ` AND sm.movement_type = $${paramCount++}`;
      params.push(movement_type);
    }

    const movements = await query(
      `SELECT sm.*, u.name as created_by_name
       FROM stock_movements sm
       LEFT JOIN users u ON sm.created_by = u.id
       ${whereClause}
       ORDER BY sm.movement_date DESC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      [...params, limit, offset]
    );

    res.json({ movements });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create stock movement
router.post('/', [
  authenticateToken,
  requirePermission('movements:create'),
  body('movement_type').isIn(['IN', 'OUT']).withMessage('Movement type must be IN or OUT'),
  body('product_name').trim().isLength({ min: 1 }).withMessage('Product name is required'),
  body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be a positive number'),
  body('unit').trim().isLength({ min: 1 }).withMessage('Unit is required'),
  body('movement_date').isISO8601().withMessage('Valid movement date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { movement_type, product_name, quantity, unit, truck_number, remarks, movement_date } = req.body;

    // Create stock movement
    const result = await runQuery(
      `INSERT INTO stock_movements 
       (movement_type, product_name, quantity, unit, truck_number, remarks, movement_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [movement_type, product_name, quantity, unit, truck_number, remarks, movement_date, req.user.id]
    );

    res.status(201).json({
      message: 'Stock movement recorded successfully',
      id: result.id
    });
  } catch (error) {
    console.error('Error creating stock movement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get stock movement by ID
router.get('/:id', authenticateToken, requireOwnership, async (req, res) => {
  try {
    const { id } = req.params;
    
    let whereClause = 'WHERE sm.id = $1';
    const params = [id];

    // Gatekeepers can only see their own entries
    if (req.user.role === 'gatekeeper') {
      whereClause += ' AND sm.created_by = $2';
      params.push(req.user.id);
    }

    const movement = await query(
      `SELECT sm.*, u.name as created_by_name
       FROM stock_movements sm
       LEFT JOIN users u ON sm.created_by = u.id
       ${whereClause}`,
      params
    );

    if (!movement) {
      return res.status(404).json({ message: 'Stock movement not found' });
    }

    res.json({ movement });
  } catch (error) {
    console.error('Error fetching stock movement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get daily summary
router.get('/summary/daily', authenticateToken, requireOwnership, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    let whereClause = 'WHERE DATE(sm.movement_date) = $1';
    const params = [targetDate];

    // Gatekeepers can only see their own entries
    if (req.user.role === 'gatekeeper') {
      whereClause += ' AND sm.created_by = $2';
      params.push(req.user.id);
    }

    const summary = await query(
      `SELECT 
         movement_type,
         COUNT(*) as count,
         SUM(quantity) as total_quantity,
         unit
       FROM stock_movements sm
       ${whereClause}
       GROUP BY movement_type, unit
       ORDER BY movement_type, unit`,
      params
    );

    res.json({ summary, date: targetDate });
  } catch (error) {
    console.error('Error fetching daily summary:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;