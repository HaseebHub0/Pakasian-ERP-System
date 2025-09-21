const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

// Get dashboard data - Director read-only access
router.get('/', authenticateToken, requirePermission('dashboard:read'), async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Sales trends
    const salesTrends = await query(
      `SELECT 
         DATE(sale_date) as date,
         COUNT(*) as orders_count,
         SUM(total_amount) as total_revenue
       FROM sales 
       WHERE sale_date >= $1
       GROUP BY DATE(sale_date)
       ORDER BY date DESC
       LIMIT 30`,
      [startDate.toISOString().split('T')[0]]
    );

    // Profit/Loss summary
    const profitLoss = await query(
      `SELECT 
         SUM(s.total_amount) as total_revenue,
         SUM(p.total_amount) as total_purchases,
         SUM(e.amount) as total_expenses,
         (SUM(s.total_amount) - SUM(p.total_amount) - SUM(e.amount)) as net_profit
       FROM sales s
       LEFT JOIN purchases p ON DATE(p.purchase_date) = DATE(s.sale_date)
       LEFT JOIN expenses e ON DATE(e.expense_date) = DATE(s.sale_date)
       WHERE s.sale_date >= $1`,
      [startDate.toISOString().split('T')[0]]
    );

    // Stock levels
    const stockLevels = await query(
      `SELECT 
         p.name as product_name,
         p.stock_quantity,
         p.min_stock_level,
         CASE 
           WHEN p.stock_quantity <= p.min_stock_level THEN 'Low'
           WHEN p.stock_quantity <= (p.min_stock_level * 1.5) THEN 'Medium'
           ELSE 'Good'
         END as stock_status
       FROM products p
       ORDER BY p.stock_quantity ASC
       LIMIT 20`
    );

    // Top selling products
    const topProducts = await query(
      `SELECT 
         p.name as product_name,
         SUM(si.quantity) as total_sold,
         SUM(si.total_price) as total_revenue
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       JOIN sales s ON si.sale_id = s.id
       WHERE s.sale_date >= $1
       GROUP BY p.id, p.name
       ORDER BY total_sold DESC
       LIMIT 10`,
      [startDate.toISOString().split('T')[0]]
    );

    // Recent activities
    const recentActivities = await query(
      `SELECT 
         'sale' as type,
         s.id,
         s.sale_date as date,
         s.total_amount as amount,
         c.name as customer_name,
         u.name as created_by
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN users u ON s.created_by = u.id
       WHERE s.sale_date >= $1
       
       UNION ALL
       
       SELECT 
         'purchase' as type,
         p.id,
         p.purchase_date as date,
         p.total_amount as amount,
         v.name as vendor_name,
         u.name as created_by
       FROM purchases p
       LEFT JOIN vendors v ON p.vendor_id = v.id
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.purchase_date >= $1
       
       ORDER BY date DESC
       LIMIT 20`,
      [startDate.toISOString().split('T')[0]]
    );

    // KPI metrics
    const kpis = await query(
      `SELECT 
         (SELECT COUNT(*) FROM sales WHERE sale_date >= $1) as total_orders,
         (SELECT SUM(total_amount) FROM sales WHERE sale_date >= $1) as total_revenue,
         (SELECT AVG(total_amount) FROM sales WHERE sale_date >= $1) as avg_order_value,
         (SELECT COUNT(DISTINCT customer_id) FROM sales WHERE sale_date >= $1) as unique_customers,
         (SELECT COUNT(*) FROM products WHERE stock_quantity <= min_stock_level) as low_stock_products
       FROM sales LIMIT 1`,
      [startDate.toISOString().split('T')[0]]
    );

    res.json({
      period: parseInt(period),
      salesTrends,
      profitLoss: profitLoss[0] || {
        total_revenue: 0,
        total_purchases: 0,
        total_expenses: 0,
        net_profit: 0
      },
      stockLevels,
      topProducts,
      recentActivities,
      kpis: kpis[0] || {
        total_orders: 0,
        total_revenue: 0,
        avg_order_value: 0,
        unique_customers: 0,
        low_stock_products: 0
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get financial reports - Director read-only access
router.get('/financial', authenticateToken, requirePermission('reports:read'), async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    // Revenue by month
    const revenueByMonth = await query(
      `SELECT 
         DATE_TRUNC('month', sale_date) as month,
         SUM(total_amount) as revenue
       FROM sales 
       WHERE sale_date BETWEEN $1 AND $2
       GROUP BY DATE_TRUNC('month', sale_date)
       ORDER BY month`,
      [start_date, end_date]
    );

    // Expenses by category
    const expensesByCategory = await query(
      `SELECT 
         category,
         SUM(amount) as total_amount
       FROM expenses 
       WHERE expense_date BETWEEN $1 AND $2
       GROUP BY category
       ORDER BY total_amount DESC`,
      [start_date, end_date]
    );

    // Profit margin analysis
    const profitMargin = await query(
      `SELECT 
         DATE_TRUNC('month', s.sale_date) as month,
         SUM(s.total_amount) as revenue,
         SUM(p.total_amount) as cost_of_goods,
         SUM(e.amount) as operating_expenses,
         (SUM(s.total_amount) - SUM(p.total_amount) - SUM(e.amount)) as net_profit,
         CASE 
           WHEN SUM(s.total_amount) > 0 THEN 
             ((SUM(s.total_amount) - SUM(p.total_amount) - SUM(e.amount)) / SUM(s.total_amount)) * 100
           ELSE 0
         END as profit_margin_percent
       FROM sales s
       LEFT JOIN purchases p ON DATE_TRUNC('month', p.purchase_date) = DATE_TRUNC('month', s.sale_date)
       LEFT JOIN expenses e ON DATE_TRUNC('month', e.expense_date) = DATE_TRUNC('month', s.sale_date)
       WHERE s.sale_date BETWEEN $1 AND $2
       GROUP BY DATE_TRUNC('month', s.sale_date)
       ORDER BY month`,
      [start_date, end_date]
    );

    res.json({
      period: { start_date, end_date },
      revenueByMonth,
      expensesByCategory,
      profitMargin
    });
  } catch (error) {
    console.error('Error fetching financial reports:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
