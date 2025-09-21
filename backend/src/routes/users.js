const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, queryAll, runQuery } = require('../config/database');
const { requireAdmin, requireManager } = require('../middleware/auth');

const router = express.Router();

// Get all users (Admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await queryAll(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      message: 'Users retrieved successfully',
      users,
      count: users.length
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user by ID (Admin/Manager or own profile)
router.get('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Allow users to view their own profile, or admins/managers to view any profile
    if (req.user.id !== userId && !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const user = await query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User retrieved successfully',
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user (Admin/Manager or own profile)
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
  body('role').optional().isIn(['user', 'admin', 'manager']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = parseInt(req.params.id);
    const { name, email, role } = req.body;

    // Check permissions
    const isOwnProfile = req.user.id === userId;
    const isAdminOrManager = ['admin', 'manager'].includes(req.user.role);
    const canChangeRole = req.user.role === 'admin';

    if (!isOwnProfile && !isAdminOrManager) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Non-admins cannot change roles
    if (role && !canChangeRole) {
      return res.status(403).json({ message: 'Only admins can change user roles' });
    }

    // Get current user
    const currentUser = await query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [userId]
    );

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (email) {
      // Check if email is already taken by another user
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );

      if (existingUser) {
        return res.status(400).json({ message: 'Email already taken' });
      }

      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }

    if (role && canChangeRole) {
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    await runQuery(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    );

    // Get updated user
    const updatedUser = await query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete user (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Prevent admin from deleting themselves
    if (req.user.id === userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await runQuery('DELETE FROM users WHERE id = $1', [userId]);

    res.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get users by role (Admin/Manager)
router.get('/role/:role', requireManager, async (req, res) => {
  try {
    const { role } = req.params;

    if (!['user', 'admin', 'manager'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const users = await queryAll(
      'SELECT id, name, email, role, created_at FROM users WHERE role = $1 ORDER BY created_at DESC',
      [role]
    );

    res.json({
      message: `Users with role '${role}' retrieved successfully`,
      users,
      count: users.length
    });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
