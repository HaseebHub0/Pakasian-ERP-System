const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const auth = require('../middleware/auth');

// Dashboard stats
router.get('/dashboard-stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    // Get total users
    const usersResult = await query('SELECT COUNT(*) as count FROM users');
    const totalUsers = usersResult[0].count;

    // Get today's stock movements
    const today = new Date().toISOString().split('T')[0];
    const stockInResult = await query(
      'SELECT SUM(quantity) as total FROM stock_movements WHERE movement_type = ? AND DATE(movement_date) = ?',
      ['IN', today]
    );
    const stockOutResult = await query(
      'SELECT SUM(quantity) as total FROM stock_movements WHERE movement_type = ? AND DATE(movement_date) = ?',
      ['OUT', today]
    );

    // Get trucks currently inside
    const trucksInsideResult = await query(
      'SELECT COUNT(*) as count FROM trucks WHERE status = ?',
      ['inside']
    );

    res.json({
      totalUsers,
      stockInToday: stockInResult[0]?.total || 0,
      stockOutToday: stockOutResult[0]?.total || 0,
      trucksInside: trucksInsideResult[0].count
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
});

// User management routes
router.get('/users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const users = await query('SELECT id, name, email, role, is_active, phone, address, last_login, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

router.post('/users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { name, email, password, role, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await query(
      'INSERT INTO users (name, email, password, role, phone, address, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)',
      [name, email, hashedPassword, role, phone || null, address || null, new Date().toISOString()]
    );

    res.status(201).json({ 
      message: 'User created successfully',
      userId: result.insertId 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

router.put('/users/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { id } = req.params;
    const { name, email, role, phone, address, is_active } = req.body;

    await query(
      'UPDATE users SET name = ?, email = ?, role = ?, phone = ?, address = ?, is_active = ? WHERE id = ?',
      [name, email, role, phone, address, is_active, id]
    );

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

router.delete('/users/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { id } = req.params;

    // Don't allow deleting own account
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await query('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

router.post('/users/:id/reset-password', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { id } = req.params;
    const newPassword = Math.random().toString(36).slice(-8); // Generate random password

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);

    res.json({ 
      message: 'Password reset successfully',
      newPassword: newPassword
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// Warehouse overview
router.get('/warehouse/overview', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Today's stock movements
    const todayStockIn = await query(
      'SELECT SUM(quantity) as total FROM stock_movements WHERE movement_type = ? AND DATE(movement_date) = ?',
      ['IN', today]
    );
    const todayStockOut = await query(
      'SELECT SUM(quantity) as total FROM stock_movements WHERE movement_type = ? AND DATE(movement_date) = ?',
      ['OUT', today]
    );

    // This week's stock movements
    const weekStockIn = await query(
      'SELECT SUM(quantity) as total FROM stock_movements WHERE movement_type = ? AND DATE(movement_date) >= ?',
      ['IN', weekStartStr]
    );
    const weekStockOut = await query(
      'SELECT SUM(quantity) as total FROM stock_movements WHERE movement_type = ? AND DATE(movement_date) >= ?',
      ['OUT', weekStartStr]
    );

    // Current stock level (simplified calculation)
    const currentStock = (todayStockIn[0]?.total || 0) - (todayStockOut[0]?.total || 0);

    // Low stock items (simplified - items with quantity < 10)
    const lowStockItems = await query(
      'SELECT product_name as name, quantity, unit, 10 as min_quantity FROM stock_movements WHERE quantity < 10 GROUP BY product_name'
    );

    // Recent movements
    const recentMovements = await query(
      'SELECT * FROM stock_movements ORDER BY movement_date DESC LIMIT 10'
    );

    res.json({
      stockInToday: todayStockIn[0]?.total || 0,
      stockOutToday: todayStockOut[0]?.total || 0,
      stockInWeek: weekStockIn[0]?.total || 0,
      stockOutWeek: weekStockOut[0]?.total || 0,
      currentStock,
      lowStockItems,
      recentMovements
    });
  } catch (error) {
    console.error('Error fetching warehouse overview:', error);
    res.status(500).json({ message: 'Error fetching warehouse overview' });
  }
});

// Truck logs
router.get('/trucks', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { search, status, start_date, end_date } = req.query;
    
    let queryStr = 'SELECT * FROM trucks WHERE 1=1';
    const params = [];

    if (search) {
      queryStr += ' AND (truck_number LIKE ? OR driver_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status && status !== 'all') {
      queryStr += ' AND status = ?';
      params.push(status);
    }

    if (start_date) {
      queryStr += ' AND DATE(entry_time) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      queryStr += ' AND DATE(entry_time) <= ?';
      params.push(end_date);
    }

    queryStr += ' ORDER BY entry_time DESC';

    const trucks = await query(queryStr, params);
    res.json(trucks);
  } catch (error) {
    console.error('Error fetching trucks:', error);
    res.status(500).json({ message: 'Error fetching trucks' });
  }
});

router.get('/trucks/export', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { format = 'csv' } = req.query;
    const trucks = await query('SELECT * FROM trucks ORDER BY entry_time DESC');

    if (format === 'csv') {
      const csv = 'Truck Number,Driver Name,Driver CNIC,Purpose,Entry Time,Exit Time,Status\n' +
        trucks.map(truck => 
          `${truck.truck_number},${truck.driver_name},${truck.driver_cnic},${truck.purpose},${truck.entry_time},${truck.exit_time || ''},${truck.status}`
        ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=truck-logs.csv');
      res.send(csv);
    } else {
      // For PDF, you would use a library like puppeteer or pdfkit
      res.json({ message: 'PDF export not implemented yet' });
    }
  } catch (error) {
    console.error('Error exporting trucks:', error);
    res.status(500).json({ message: 'Error exporting trucks' });
  }
});

// Reports
router.get('/reports', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { period = 'today' } = req.query;
    
    let dateFilter = '';
    const params = [];

    if (period === 'today') {
      dateFilter = 'DATE(movement_date) = ?';
      params.push(new Date().toISOString().split('T')[0]);
    } else if (period === 'week') {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      dateFilter = 'DATE(movement_date) >= ?';
      params.push(weekStart.toISOString().split('T')[0]);
    } else if (period === 'month') {
      const monthStart = new Date();
      monthStart.setDate(monthStart.getDate() - 30);
      dateFilter = 'DATE(movement_date) >= ?';
      params.push(monthStart.toISOString().split('T')[0]);
    }

    // Stock summary
    const stockInResult = await query(
      `SELECT SUM(quantity) as total FROM stock_movements WHERE movement_type = ? AND ${dateFilter}`,
      ['IN', ...params]
    );
    const stockOutResult = await query(
      `SELECT SUM(quantity) as total FROM stock_movements WHERE movement_type = ? AND ${dateFilter}`,
      ['OUT', ...params]
    );

    // Truck summary
    const truckEntriesResult = await query(
      `SELECT COUNT(*) as count FROM trucks WHERE ${dateFilter.replace('movement_date', 'entry_time')}`,
      params
    );
    const trucksInsideResult = await query('SELECT COUNT(*) as count FROM trucks WHERE status = ?', ['inside']);

    // Top products
    const topProducts = await query(
      `SELECT product_name as name, unit, 
       SUM(CASE WHEN movement_type = 'IN' THEN quantity ELSE 0 END) as totalIn,
       SUM(CASE WHEN movement_type = 'OUT' THEN quantity ELSE 0 END) as totalOut,
       SUM(CASE WHEN movement_type = 'IN' THEN quantity ELSE -quantity END) as netMovement
       FROM stock_movements WHERE ${dateFilter}
       GROUP BY product_name, unit ORDER BY ABS(netMovement) DESC LIMIT 10`,
      params
    );

    // Recent activities (simplified)
    const recentActivities = await query(
      `SELECT 'Stock Movement' as title, 
       CONCAT(movement_type, ' - ', product_name, ' (', quantity, ' ', unit, ')') as description,
       movement_date as timestamp
       FROM stock_movements WHERE ${dateFilter}
       ORDER BY movement_date DESC LIMIT 10`,
      params
    );

    res.json({
      dailyStockSummary: {
        stockIn: stockInResult[0]?.total || 0,
        stockOut: stockOutResult[0]?.total || 0,
        netChange: (stockInResult[0]?.total || 0) - (stockOutResult[0]?.total || 0)
      },
      weeklyStockSummary: {
        stockIn: stockInResult[0]?.total || 0,
        stockOut: stockOutResult[0]?.total || 0,
        netChange: (stockInResult[0]?.total || 0) - (stockOutResult[0]?.total || 0)
      },
      truckSummary: {
        totalEntries: truckEntriesResult[0].count,
        currentlyInside: trucksInsideResult[0].count,
        averageStayTime: 4 // Simplified - would need actual calculation
      },
      topProducts,
      recentActivities
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Error fetching reports' });
  }
});

router.get('/reports/download', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { format = 'pdf', period = 'today' } = req.query;
    
    // For now, return a simple text response
    // In a real implementation, you would generate actual PDF/Excel files
    const reportData = {
      period,
      generatedAt: new Date().toISOString(),
      message: `${format.toUpperCase()} report for ${period} period`
    };

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=report.csv');
    } else if (format === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');
    }

    res.json(reportData);
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ message: 'Error downloading report' });
  }
});

module.exports = router;
