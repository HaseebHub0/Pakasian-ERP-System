const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, runQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission, requireOwnership } = require('../middleware/rbac');

const router = express.Router();

// Get all trucks - Gatekeepers see only their own entries
router.get('/', authenticateToken, requireOwnership, async (req, res) => {
  try {
    const { status, start_date, end_date, limit = 50, offset = 0 } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 1;

    // Gatekeepers can only see their own entries
    if (req.user.role === 'gatekeeper') {
      whereClause += ` AND t.created_by = $${paramCount++}`;
      params.push(req.user.id);
    }

    if (status) {
      whereClause += ` AND t.status = $${paramCount++}`;
      params.push(status);
    }

    if (start_date) {
      whereClause += ` AND DATE(t.entry_time) >= $${paramCount++}`;
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ` AND DATE(t.entry_time) <= $${paramCount++}`;
      params.push(end_date);
    }

    const trucks = await query(
      `SELECT t.*, u.name as created_by_name
       FROM trucks t
       LEFT JOIN users u ON t.created_by = u.id
       ${whereClause}
       ORDER BY t.entry_time DESC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      [...params, limit, offset]
    );

    res.json({ trucks });
  } catch (error) {
    console.error('Error fetching trucks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create truck entry
router.post('/entry', [
  authenticateToken,
  requirePermission('trucks:create'),
  body('truck_number').trim().isLength({ min: 1 }).withMessage('Truck number is required'),
  body('driver_name').trim().isLength({ min: 2 }).withMessage('Driver name must be at least 2 characters'),
  body('driver_cnic').trim().isLength({ min: 13, max: 15 }).withMessage('Driver CNIC must be 13-15 characters'),
  body('entry_type').isIn(['IN', 'OUT']).withMessage('Entry type must be IN or OUT'),
  body('purpose').trim().isLength({ min: 1 }).withMessage('Purpose is required'),
  body('entry_time').isISO8601().withMessage('Valid entry time is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { truck_number, driver_name, driver_cnic, entry_type, purpose, entry_time, remarks } = req.body;

    // Check if truck is already inside (for IN entries)
    if (entry_type === 'IN') {
      const existingTruck = await query(
        'SELECT id FROM trucks WHERE truck_number = $1 AND status = "inside"',
        [truck_number]
      );

      if (existingTruck) {
        return res.status(400).json({ 
          message: 'Truck is already inside the premises',
          truck_number: truck_number
        });
      }
    }

    // Create truck entry
    const result = await runQuery(
      `INSERT INTO trucks 
       (truck_number, driver_name, driver_cnic, entry_type, entry_time, purpose, remarks, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [truck_number, driver_name, driver_cnic, entry_type, entry_time, purpose, remarks, req.user.id]
    );

    // Create gate log
    await runQuery(
      `INSERT INTO gate_logs (truck_id, action, action_time, notes, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [result.id, entry_type === 'IN' ? 'entry' : 'exit', entry_time, remarks, req.user.id]
    );

    res.status(201).json({
      message: `Truck ${entry_type} logged successfully`,
      id: result.id
    });
  } catch (error) {
    console.error('Error creating truck entry:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update truck exit
router.put('/:id/exit', [
  authenticateToken,
  requirePermission('trucks:update'),
  body('exit_time').isISO8601().withMessage('Valid exit time is required')
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
    const { exit_time, notes } = req.body;

    // Check if truck exists and is inside
    const truck = await query(
      'SELECT * FROM trucks WHERE id = $1 AND status = "inside"',
      [id]
    );

    if (!truck) {
      return res.status(404).json({ 
        message: 'Truck not found or already exited' 
      });
    }

    // Update truck status
    await runQuery(
      'UPDATE trucks SET status = "exited", exit_time = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [exit_time, id]
    );

    // Create gate log for exit
    await runQuery(
      `INSERT INTO gate_logs (truck_id, action, action_time, notes, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, 'exit', exit_time, notes, req.user.id]
    );

    res.json({ message: 'Truck exit logged successfully' });
  } catch (error) {
    console.error('Error updating truck exit:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get truck by ID
router.get('/:id', authenticateToken, requireOwnership, async (req, res) => {
  try {
    const { id } = req.params;
    
    let whereClause = 'WHERE t.id = $1';
    const params = [id];

    // Gatekeepers can only see their own entries
    if (req.user.role === 'gatekeeper') {
      whereClause += ' AND t.created_by = $2';
      params.push(req.user.id);
    }

    const truck = await query(
      `SELECT t.*, u.name as created_by_name
       FROM trucks t
       LEFT JOIN users u ON t.created_by = u.id
       ${whereClause}`,
      params
    );

    if (!truck) {
      return res.status(404).json({ message: 'Truck not found' });
    }

    // Get gate logs for this truck
    const logs = await query(
      `SELECT gl.*, u.name as created_by_name
       FROM gate_logs gl
       LEFT JOIN users u ON gl.created_by = u.id
       WHERE gl.truck_id = $1
       ORDER BY gl.action_time DESC`,
      [id]
    );

    res.json({ 
      truck: {
        ...truck,
        logs
      }
    });
  } catch (error) {
    console.error('Error fetching truck:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get trucks currently inside
router.get('/status/inside', authenticateToken, requireOwnership, async (req, res) => {
  try {
    let whereClause = 'WHERE t.status = "inside"';
    const params = [];
    let paramCount = 1;

    // Gatekeepers can only see their own entries
    if (req.user.role === 'gatekeeper') {
      whereClause += ` AND t.created_by = $${paramCount++}`;
      params.push(req.user.id);
    }

    const trucks = await query(
      `SELECT t.*, u.name as created_by_name
       FROM trucks t
       LEFT JOIN users u ON t.created_by = u.id
       ${whereClause}
       ORDER BY t.entry_time DESC`,
      params
    );

    res.json({ trucks });
  } catch (error) {
    console.error('Error fetching trucks inside:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
