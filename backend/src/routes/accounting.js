const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const auth = require('../middleware/auth');

// Dashboard statistics
router.get('/dashboard-stats', auth, async (req, res) => {
  try {
    // Check if user is accountant
    if (req.user.role !== 'accountant') {
      return res.status(403).json({ message: 'Access denied. Accountant role required.' });
    }

    // Get total sales
    const salesResult = await query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_sales,
        COUNT(*) as sales_count
      FROM sales_invoices 
      WHERE created_at >= date('now', '-30 days')
    `);

    // Get total purchases
    const purchasesResult = await query(`
      SELECT 
        COALESCE(SUM(total_cost), 0) as total_purchases,
        COUNT(*) as purchases_count
      FROM purchases 
      WHERE created_at >= date('now', '-30 days')
    `);

    // Get current stock value (simplified calculation)
    const stockResult = await query(`
      SELECT 
        COALESCE(SUM(current_stock * unit_cost), 0) as current_stock_value
      FROM products 
      WHERE current_stock > 0
    `);

    const totalSales = salesResult[0]?.total_sales || 0;
    const totalPurchases = purchasesResult[0]?.total_purchases || 0;
    const netProfit = totalSales - totalPurchases;
    const currentStockValue = stockResult[0]?.current_stock_value || 0;

    res.json({
      totalSales,
      totalPurchases,
      netProfit,
      currentStockValue,
      monthlySales: totalSales,
      monthlyPurchases: totalPurchases
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
});

// Purchases routes
router.get('/purchases', auth, async (req, res) => {
  try {
    if (req.user.role !== 'accountant') {
      return res.status(403).json({ message: 'Access denied. Accountant role required.' });
    }

    const { search, supplier, start_date, end_date } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (product_name LIKE ? OR invoice_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (supplier) {
      whereClause += ' AND supplier_name LIKE ?';
      params.push(`%${supplier}%`);
    }

    if (start_date) {
      whereClause += ' AND purchase_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND purchase_date <= ?';
      params.push(end_date);
    }

    const purchases = await query(`
      SELECT * FROM purchases 
      ${whereClause}
      ORDER BY purchase_date DESC
    `, params);

    res.json(purchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ message: 'Error fetching purchases' });
  }
});

router.post('/purchases', auth, async (req, res) => {
  try {
    if (req.user.role !== 'accountant') {
      return res.status(403).json({ message: 'Access denied. Accountant role required.' });
    }

    const {
      invoice_number,
      supplier_name,
      product_name,
      quantity,
      unit,
      unit_cost,
      total_cost,
      purchase_date,
      description
    } = req.body;

    // Validate required fields
    if (!invoice_number || !supplier_name || !product_name || !quantity || !unit_cost) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await query(`
      INSERT INTO purchases (
        invoice_number, supplier_name, product_name, quantity, unit, 
        unit_cost, total_cost, purchase_date, description, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invoice_number, supplier_name, product_name, quantity, unit,
      unit_cost, total_cost, purchase_date, description || '', req.user.id
    ]);

    res.status(201).json({
      message: 'Purchase record created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating purchase:', error);
    res.status(500).json({ message: 'Error creating purchase record' });
  }
});

router.delete('/purchases/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'accountant') {
      return res.status(403).json({ message: 'Access denied. Accountant role required.' });
    }

    const { id } = req.params;
    await query('DELETE FROM purchases WHERE id = ?', [id]);

    res.json({ message: 'Purchase record deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    res.status(500).json({ message: 'Error deleting purchase record' });
  }
});

// Sales routes
router.get('/sales', auth, async (req, res) => {
  try {
    if (req.user.role !== 'accountant') {
      return res.status(403).json({ message: 'Access denied. Accountant role required.' });
    }

    const { search, customer, start_date, end_date } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (product_name LIKE ? OR invoice_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (customer) {
      whereClause += ' AND customer_name LIKE ?';
      params.push(`%${customer}%`);
    }

    if (start_date) {
      whereClause += ' AND sale_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND sale_date <= ?';
      params.push(end_date);
    }

    const sales = await query(`
      SELECT * FROM sales_invoices 
      ${whereClause}
      ORDER BY sale_date DESC
    `, params);

    res.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ message: 'Error fetching sales' });
  }
});

router.post('/sales', auth, async (req, res) => {
  try {
    if (req.user.role !== 'accountant') {
      return res.status(403).json({ message: 'Access denied. Accountant role required.' });
    }

    const {
      invoice_number,
      customer_name,
      product_name,
      quantity,
      unit,
      sale_price,
      total_amount,
      sale_date,
      description
    } = req.body;

    // Validate required fields
    if (!invoice_number || !customer_name || !product_name || !quantity || !sale_price) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await query(`
      INSERT INTO sales_invoices (
        invoice_number, customer_name, product_name, quantity, unit, 
        sale_price, total_amount, sale_date, description, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invoice_number, customer_name, product_name, quantity, unit,
      sale_price, total_amount, sale_date, description || '', req.user.id
    ]);

    res.status(201).json({
      message: 'Sales record created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ message: 'Error creating sales record' });
  }
});

router.delete('/sales/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'accountant') {
      return res.status(403).json({ message: 'Access denied. Accountant role required.' });
    }

    const { id } = req.params;
    await query('DELETE FROM sales_invoices WHERE id = ?', [id]);

    res.json({ message: 'Sales record deleted successfully' });
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ message: 'Error deleting sales record' });
  }
});

// Profit & Loss routes
router.get('/profit-loss', auth, async (req, res) => {
  try {
    if (req.user.role !== 'accountant') {
      return res.status(403).json({ message: 'Access denied. Accountant role required.' });
    }

    const { start_date, end_date, period } = req.query;
    
    // Get sales data
    const salesResult = await query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_sales,
        COUNT(*) as sales_count
      FROM sales_invoices 
      WHERE sale_date >= ? AND sale_date <= ?
    `, [start_date, end_date]);

    // Get purchases data
    const purchasesResult = await query(`
      SELECT 
        COALESCE(SUM(total_cost), 0) as total_purchases,
        COUNT(*) as purchases_count
      FROM purchases 
      WHERE purchase_date >= ? AND purchase_date <= ?
    `, [start_date, end_date]);

    const totalSales = salesResult[0]?.total_sales || 0;
    const totalPurchases = purchasesResult[0]?.total_purchases || 0;
    const netProfit = totalSales - totalPurchases;

    res.json({
      total_sales: totalSales,
      total_purchases: totalPurchases,
      net_profit: netProfit,
      sales_count: salesResult[0]?.sales_count || 0,
      purchases_count: purchasesResult[0]?.purchases_count || 0
    });
  } catch (error) {
    console.error('Error fetching profit loss data:', error);
    res.status(500).json({ message: 'Error fetching profit loss data' });
  }
});

// Stock Valuation routes
router.get('/stock-valuation', auth, async (req, res) => {
  try {
    if (req.user.role !== 'accountant') {
      return res.status(403).json({ message: 'Access denied. Accountant role required.' });
    }

    const { search, category, sort_by } = req.query;
    
    // Get products with their purchase history for weighted average calculation
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      whereClause += ' AND p.category = ?';
      params.push(category);
    }

    let orderClause = 'ORDER BY p.name ASC';
    switch (sort_by) {
      case 'value_desc':
        orderClause = 'ORDER BY current_value DESC';
        break;
      case 'value_asc':
        orderClause = 'ORDER BY current_value ASC';
        break;
      case 'name_desc':
        orderClause = 'ORDER BY p.name DESC';
        break;
      case 'stock_desc':
        orderClause = 'ORDER BY p.current_stock DESC';
        break;
      case 'stock_asc':
        orderClause = 'ORDER BY p.current_stock ASC';
        break;
    }

    const products = await query(`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM purchases WHERE product_name = p.name) as purchase_count,
        (SELECT AVG(unit_cost) FROM purchases WHERE product_name = p.name) as avg_cost,
        (p.current_stock * COALESCE((SELECT AVG(unit_cost) FROM purchases WHERE product_name = p.name), p.unit_cost)) as current_value,
        (SELECT MAX(purchase_date) FROM purchases WHERE product_name = p.name) as last_purchase_date
      FROM products p
      ${whereClause}
      ${orderClause}
    `, params);

    // Calculate summary
    const totalValue = products.reduce((sum, product) => sum + (product.current_value || 0), 0);
    const totalItems = products.length;
    const averageValue = totalItems > 0 ? totalValue / totalItems : 0;
    const lowStockItems = products.filter(p => p.current_stock < (p.min_stock || 10)).length;

    res.json({
      products,
      summary: {
        total_value: totalValue,
        total_items: totalItems,
        average_value: averageValue,
        low_stock_items: lowStockItems
      }
    });
  } catch (error) {
    console.error('Error fetching stock valuation:', error);
    res.status(500).json({ message: 'Error fetching stock valuation' });
  }
});

module.exports = router;
