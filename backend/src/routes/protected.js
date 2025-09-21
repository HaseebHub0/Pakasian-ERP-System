const express = require('express');
const { 
  authenticateToken, 
  requireRole,
  requireAdmin, 
  requireAccountant, 
  requireDirector, 
  requireGatekeeper,
  requireAdminOrDirector,
  requireFinancialAccess,
  requireWarehouseAccess,
  requireReadOnlyAccess
} = require('../middleware/auth');
const pdfGenerator = require('../services/pdfGenerator');
const auditService = require('../services/auditService');

const router = express.Router();

// =============================================
// ADMIN ONLY ROUTES
// Full system access - can manage users, products, warehouses
// =============================================

router.get('/admin/system-info', authenticateToken, requireAdmin, (req, res) => {
  res.json({ 
    message: `Welcome, Admin ${req.user.name}! Full system access granted.`,
    user: req.user,
    permissions: ['users', 'products', 'warehouses', 'all_operations'],
    systemInfo: {
      serverTime: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version
    }
  });
});

router.get('/admin/users', authenticateToken, requireAdmin, (req, res) => {
  res.json({ 
    message: `Admin ${req.user.name} can manage all users.`,
    user: req.user,
    data: ['System Administrator', 'Executive Director', 'Chief Accountant', 'Warehouse Gatekeeper']
  });
});

router.get('/admin/products', authenticateToken, requireAdmin, (req, res) => {
  res.json({ 
    message: `Admin ${req.user.name} can manage all products.`,
    user: req.user,
    data: ['Protein Nimko 100g', 'Protein Nimko 250g', 'Spicy Nimko Mix', 'Salted Chips 50g', 'Salted Chips 100g']
  });
});

router.get('/admin/warehouses', authenticateToken, requireAdmin, (req, res) => {
  res.json({ 
    message: `Admin ${req.user.name} can manage all warehouses.`,
    user: req.user,
    data: ['Main Warehouse', 'Secondary Warehouse']
  });
});

// =============================================
// DIRECTOR ROUTES (READ-ONLY)
// Executive level - read-only access to business performance dashboards
// =============================================

router.get('/director/executive-dashboard', authenticateToken, requireDirector, async (req, res) => {
  try {
    const { runQuery } = require('../config/database');
    const { start_date, end_date } = req.query;
    
    // Default to last 30 days if no date range provided
    const endDate = end_date || new Date().toISOString().split('T')[0];
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Get current stock levels for all products
    const stockLevels = await runQuery(`
      SELECT 
        p.id, p.name, p.sku, p.current_stock, p.min_stock_level, p.selling_price,
        p.batch_number, p.expiry_date, p.supplier_name,
        CASE 
          WHEN p.current_stock <= p.min_stock_level THEN 'low'
          WHEN p.current_stock <= p.min_stock_level * 1.5 THEN 'medium'
          ELSE 'high'
        END as stock_status
      FROM products p
      WHERE p.is_active = true
      ORDER BY p.current_stock ASC
    `);
    
    // Get daily sales trend
    const dailySalesTrend = await runQuery(`
      SELECT 
        DATE(invoice_date) as date,
        COUNT(*) as invoice_count,
        SUM(total_amount) as total_sales,
        SUM(paid_amount) as paid_amount,
        SUM(balance_amount) as outstanding_amount
      FROM sales_invoices 
      WHERE invoice_date BETWEEN $1 AND $2
      GROUP BY DATE(invoice_date) 
      ORDER BY date ASC
    `, [startDate, endDate]);
    
    // Get monthly expenses vs income
    const monthlyData = await runQuery(`
      SELECT 
        DATE_TRUNC('month', invoice_date) as month,
        SUM(total_amount) as monthly_income,
        (SELECT SUM(amount) FROM expenses WHERE DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', si.invoice_date)) as monthly_expenses
      FROM sales_invoices si
      WHERE invoice_date BETWEEN $1 AND $2
      GROUP BY DATE_TRUNC('month', invoice_date)
      ORDER BY month ASC
    `, [startDate, endDate]);
    
    // Get top 5 selling products
    const topSellingProducts = await runQuery(`
      SELECT 
        p.name as product_name,
        p.sku,
        SUM(sii.quantity) as total_quantity_sold,
        SUM(sii.total_price) as total_revenue,
        COUNT(DISTINCT si.id) as invoice_count,
        AVG(sii.unit_price) as avg_selling_price
      FROM sales_invoice_items sii
      JOIN sales_invoices si ON sii.invoice_id = si.id
      JOIN products p ON sii.product_id = p.id
      WHERE si.invoice_date BETWEEN $1 AND $2
      GROUP BY p.id, p.name, p.sku
      ORDER BY total_quantity_sold DESC
      LIMIT 5
    `, [startDate, endDate]);
    
    // Get overall financial summary
    const financialSummary = await runQuery(`
      SELECT 
        (SELECT SUM(total_amount) FROM sales_invoices WHERE invoice_date BETWEEN $1 AND $2) as total_revenue,
        (SELECT SUM(amount) FROM expenses WHERE expense_date BETWEEN $1 AND $2) as total_expenses,
        (SELECT SUM(total_amount) FROM purchases WHERE purchase_date BETWEEN $1 AND $2) as total_purchases,
        (SELECT COUNT(*) FROM sales_invoices WHERE invoice_date BETWEEN $1 AND $2) as total_invoices,
        (SELECT COUNT(*) FROM expenses WHERE expense_date BETWEEN $1 AND $2) as total_expense_entries
    `, [startDate, endDate]);
    
    // Get low stock alerts
    const lowStockAlerts = stockLevels.filter(product => product.stock_status === 'low');
    
    // Calculate profit margin
    const totalRevenue = parseFloat(financialSummary[0].total_revenue || 0);
    const totalExpenses = parseFloat(financialSummary[0].total_expenses || 0);
    const totalPurchases = parseFloat(financialSummary[0].total_purchases || 0);
    const netProfit = totalRevenue - totalExpenses - totalPurchases;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    res.json({
      success: true,
      message: `Welcome, Director ${req.user.name}! Executive dashboard - read-only access.`,
      user: req.user,
      period: { start_date: startDate, end_date: endDate },
      dashboard: {
        financialSummary: {
          total_revenue: totalRevenue,
          total_expenses: totalExpenses,
          total_purchases: totalPurchases,
          net_profit: netProfit,
          profit_margin: profitMargin,
          total_invoices: parseInt(financialSummary[0].total_invoices || 0),
          total_expense_entries: parseInt(financialSummary[0].total_expense_entries || 0)
        },
        stockLevels,
        lowStockAlerts,
        dailySalesTrend,
        monthlyData,
        topSellingProducts
      }
    });
  } catch (error) {
    console.error('Error fetching director dashboard:', error);
    res.status(500).json({
      error: 'Failed to fetch director dashboard data',
      details: error.message
    });
  }
});

router.get('/director/strategic-reports', authenticateToken, requireDirector, (req, res) => {
  res.json({ 
    message: `Director ${req.user.name} can view strategic reports.`,
    user: req.user,
    reports: ['Market Analysis', 'Growth Projections', 'Competitor Analysis', 'Financial Performance', 'Production Efficiency']
  });
});

router.get('/director/business-performance', authenticateToken, requireDirector, (req, res) => {
  res.json({ 
    message: `Director ${req.user.name} viewing business performance metrics.`,
    user: req.user,
    metrics: {
      sales_growth: '+12%',
      profit_margin: '16%',
      customer_satisfaction: '4.2/5',
      employee_retention: '95%',
      production_efficiency: '87%',
      quality_score: '98.5%'
    }
  });
});

router.get('/director/market-analysis', authenticateToken, requireDirector, (req, res) => {
  res.json({ 
    message: `Director ${req.user.name} viewing market analysis.`,
    user: req.user,
    analysis: {
      market_size: '₹500M',
      our_market_share: '15%',
      competitor_analysis: 'Top 3 competitors',
      growth_opportunities: ['Export markets', 'New product lines', 'Online sales']
    }
  });
});

// =============================================
// ACCOUNTANT ROUTES
// Financial management - can record sales, purchases, expenses and generate profit/loss reports
// =============================================

// =============================================
// ACCOUNTING DASHBOARD & REPORTS
// =============================================

router.get('/accounting/dashboard', authenticateToken, requireAccountant, async (req, res) => {
  try {
    const { runQuery } = require('../config/database');
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    // Get daily sales for the past week
    const dailySales = await runQuery(`
      SELECT 
        DATE(invoice_date) as date,
        COUNT(*) as invoice_count,
        SUM(total_amount) as total_sales,
        SUM(paid_amount) as paid_amount,
        SUM(balance_amount) as outstanding_amount
      FROM sales_invoices 
      WHERE invoice_date >= $1 
      GROUP BY DATE(invoice_date) 
      ORDER BY date DESC
    `, [oneWeekAgo]);
    
    // Get daily expenses for the past week
    const dailyExpenses = await runQuery(`
      SELECT 
        DATE(expense_date) as date,
        COUNT(*) as expense_count,
        SUM(amount) as total_expenses
      FROM expenses 
      WHERE expense_date >= $1 
      GROUP BY DATE(expense_date) 
      ORDER BY date DESC
    `, [oneWeekAgo]);
    
    // Get daily purchases for the past week
    const dailyPurchases = await runQuery(`
      SELECT 
        DATE(purchase_date) as date,
        COUNT(*) as purchase_count,
        SUM(total_amount) as total_purchases
      FROM purchases 
      WHERE purchase_date >= $1 
      GROUP BY DATE(purchase_date) 
      ORDER BY date DESC
    `, [oneWeekAgo]);
    
    // Calculate totals
    const totalSales = dailySales.reduce((sum, day) => sum + parseFloat(day.total_sales || 0), 0);
    const totalExpenses = dailyExpenses.reduce((sum, day) => sum + parseFloat(day.total_expenses || 0), 0);
    const totalPurchases = dailyPurchases.reduce((sum, day) => sum + parseFloat(day.total_purchases || 0), 0);
    const netProfit = totalSales - totalExpenses - totalPurchases;
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
    
    // Get recent transactions
    const recentInvoices = await runQuery(`
      SELECT invoice_number, customer_name, total_amount, payment_status, invoice_date
      FROM sales_invoices 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    const recentExpenses = await runQuery(`
      SELECT expense_number, description, amount, expense_category, expense_date
      FROM expenses 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    const recentPurchases = await runQuery(`
      SELECT purchase_number, supplier_name, total_amount, payment_status, purchase_date
      FROM purchases 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    res.json({
      success: true,
      message: `Welcome, Accountant ${req.user.name}!`,
      user: req.user,
      dashboard: {
        summary: {
          totalSales: totalSales,
          totalExpenses: totalExpenses,
          totalPurchases: totalPurchases,
          netProfit: netProfit,
          profitMargin: profitMargin
        },
        dailySales,
        dailyExpenses,
        dailyPurchases,
        recentTransactions: {
          invoices: recentInvoices,
          expenses: recentExpenses,
          purchases: recentPurchases
        }
      }
    });
  } catch (error) {
    console.error('Error fetching accounting dashboard:', error);
    res.status(500).json({
      error: 'Failed to fetch accounting dashboard',
      details: error.message
    });
  }
});

// =============================================
// PURCHASES MANAGEMENT
// =============================================

router.get('/accounting/purchases', authenticateToken, requireAccountant, async (req, res) => {
  try {
    const { runQuery } = require('../config/database');
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    let params = [limit, offset];
    
    if (status) {
      whereClause = 'WHERE payment_status = $3';
      params = [limit, offset, status];
    }
    
    const purchases = await runQuery(`
      SELECT p.*, u.name as created_by_name
      FROM purchases p
      JOIN users u ON p.created_by = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `, params);
    
    const totalCount = await runQuery(`
      SELECT COUNT(*) as count FROM purchases ${whereClause}
    `, status ? [status] : []);
    
    res.json({
      success: true,
      data: purchases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(totalCount[0].count),
        pages: Math.ceil(totalCount[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({
      error: 'Failed to fetch purchases',
      details: error.message
    });
  }
});

router.post('/accounting/purchases', authenticateToken, requireAccountant, async (req, res) => {
  try {
    const { 
      supplier_name, supplier_contact, supplier_phone, supplier_email, supplier_address,
      purchase_date, expected_delivery_date, items, notes 
    } = req.body;
    
    if (!supplier_name || !purchase_date || !items || items.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields: supplier_name, purchase_date, items'
      });
    }
    
    const { runQuery } = require('../config/database');
    
    // Generate purchase number
    const purchaseNumber = `PO-2024-${Date.now().toString().slice(-6)}`;
    
    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;
    
    items.forEach(item => {
      const itemTotal = item.quantity * item.unit_price;
      const itemTax = (itemTotal * item.tax_rate) / 100;
      subtotal += itemTotal;
      totalTax += itemTax;
    });
    
    const totalAmount = subtotal + totalTax;
    
    // Insert purchase
    const purchaseResult = await runQuery(`
      INSERT INTO purchases (
        purchase_number, supplier_name, supplier_contact, supplier_phone, supplier_email, supplier_address,
        purchase_date, expected_delivery_date, subtotal, tax_amount, total_amount, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, purchase_number
    `, [
      purchaseNumber, supplier_name, supplier_contact, supplier_phone, supplier_email, supplier_address,
      purchase_date, expected_delivery_date, subtotal, totalTax, totalAmount, notes, req.user.id
    ]);
    
    // Insert purchase items
    for (const item of items) {
      await runQuery(`
        INSERT INTO purchase_items (
          purchase_id, item_name, item_category, item_description, unit_of_measure,
          quantity, unit_price, total_price, tax_rate, tax_amount, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        purchaseResult.id, item.item_name, item.item_category, item.item_description, item.unit_of_measure,
        item.quantity, item.unit_price, item.quantity * item.unit_price, item.tax_rate, 
        (item.quantity * item.unit_price * item.tax_rate) / 100, item.notes
      ]);
    }
    
    // Log audit trail
    await auditService.logAccountantActivity(
      req, 
      'insert', 
      'purchases', 
      purchaseResult.id, 
      null, 
      {
        purchase_number: purchaseResult.purchase_number,
        supplier_name,
        supplier_contact,
        supplier_phone,
        supplier_email,
        supplier_address,
        purchase_date,
        expected_delivery_date,
        subtotal,
        tax_amount: totalTax,
        total_amount: totalAmount,
        notes,
        items_count: items.length
      }
    );
    
    res.json({
      success: true,
      message: `Purchase ${purchaseResult.purchase_number} created successfully`,
      data: {
        id: purchaseResult.id,
        purchase_number: purchaseResult.purchase_number,
        total_amount: totalAmount
      }
    });
  } catch (error) {
    console.error('Error creating purchase:', error);
    res.status(500).json({
      error: 'Failed to create purchase',
      details: error.message
    });
  }
});

// =============================================
// EXPENSES MANAGEMENT
// =============================================

router.get('/accounting/expenses', authenticateToken, requireAccountant, async (req, res) => {
  try {
    const { runQuery } = require('../config/database');
    const { page = 1, limit = 20, category, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    let params = [limit, offset];
    let paramIndex = 3;
    
    if (category) {
      whereClause += `WHERE expense_category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (start_date) {
      whereClause += whereClause ? ` AND expense_date >= $${paramIndex}` : `WHERE expense_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }
    
    if (end_date) {
      whereClause += whereClause ? ` AND expense_date <= $${paramIndex}` : `WHERE expense_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }
    
    const expenses = await runQuery(`
      SELECT e.*, u.name as created_by_name
      FROM expenses e
      JOIN users u ON e.created_by = u.id
      ${whereClause}
      ORDER BY e.expense_date DESC
      LIMIT $1 OFFSET $2
    `, params);
    
    res.json({
      success: true,
      data: expenses
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      error: 'Failed to fetch expenses',
      details: error.message
    });
  }
});

router.post('/accounting/expenses', authenticateToken, requireAccountant, async (req, res) => {
  try {
    const { 
      expense_category, expense_type, description, amount, expense_date,
      payment_method, vendor_name, vendor_contact, reference_number, notes 
    } = req.body;
    
    if (!expense_category || !expense_type || !description || !amount || !expense_date) {
      return res.status(400).json({
        error: 'Missing required fields: expense_category, expense_type, description, amount, expense_date'
      });
    }
    
    const { runQuery } = require('../config/database');
    
    // Generate expense number
    const expenseNumber = `EXP-2024-${Date.now().toString().slice(-6)}`;
    
    // Insert expense
    const expenseResult = await runQuery(`
      INSERT INTO expenses (
        expense_number, expense_category, expense_type, description, amount, expense_date,
        payment_method, vendor_name, vendor_contact, reference_number, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, expense_number
    `, [
      expenseNumber, expense_category, expense_type, description, amount, expense_date,
      payment_method, vendor_name, vendor_contact, reference_number, notes, req.user.id
    ]);
    
    // Log audit trail
    await auditService.logAccountantActivity(
      req, 
      'insert', 
      'expenses', 
      expenseResult.id, 
      null, 
      {
        expense_number: expenseResult.expense_number,
        expense_category,
        expense_type,
        description,
        amount,
        expense_date,
        payment_method,
        vendor_name,
        vendor_contact,
        reference_number,
        notes
      }
    );
    
    res.json({
      success: true,
      message: `Expense ${expenseResult.expense_number} recorded successfully`,
      data: {
        id: expenseResult.id,
        expense_number: expenseResult.expense_number,
        amount: amount
      }
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({
      error: 'Failed to create expense',
      details: error.message
    });
  }
});

// =============================================
// SALES INVOICES MANAGEMENT
// =============================================

router.get('/accounting/sales-invoices', authenticateToken, requireAccountant, async (req, res) => {
  try {
    const { runQuery } = require('../config/database');
    const { page = 1, limit = 20, status, customer_type } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    let params = [limit, offset];
    let paramIndex = 3;
    
    if (status) {
      whereClause += `WHERE payment_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (customer_type) {
      whereClause += whereClause ? ` AND customer_type = $${paramIndex}` : `WHERE customer_type = $${paramIndex}`;
      params.push(customer_type);
      paramIndex++;
    }
    
    const invoices = await runQuery(`
      SELECT si.*, u.name as created_by_name
      FROM sales_invoices si
      JOIN users u ON si.created_by = u.id
      ${whereClause}
      ORDER BY si.created_at DESC
      LIMIT $1 OFFSET $2
    `, params);
    
    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error fetching sales invoices:', error);
    res.status(500).json({
      error: 'Failed to fetch sales invoices',
      details: error.message
    });
  }
});

router.post('/accounting/sales-invoices', authenticateToken, requireAccountant, async (req, res) => {
  try {
    const { 
      customer_name, customer_contact, customer_phone, customer_email, customer_address, customer_type,
      invoice_date, due_date, items, notes 
    } = req.body;
    
    if (!customer_name || !invoice_date || !items || items.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields: customer_name, invoice_date, items'
      });
    }
    
    const { runQuery } = require('../config/database');
    
    // Generate invoice number
    const invoiceNumber = `INV-2024-${Date.now().toString().slice(-6)}`;
    
    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    
    items.forEach(item => {
      const itemTotal = item.quantity * item.unit_price;
      const itemDiscount = (itemTotal * item.discount_percentage) / 100;
      const itemAfterDiscount = itemTotal - itemDiscount;
      const itemTax = (itemAfterDiscount * item.tax_rate) / 100;
      
      subtotal += itemAfterDiscount;
      totalTax += itemTax;
      totalDiscount += itemDiscount;
    });
    
    const totalAmount = subtotal + totalTax;
    
    // Insert invoice
    const invoiceResult = await runQuery(`
      INSERT INTO sales_invoices (
        invoice_number, customer_name, customer_contact, customer_phone, customer_email, customer_address, customer_type,
        invoice_date, due_date, subtotal, tax_amount, discount_amount, total_amount, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, invoice_number
    `, [
      invoiceNumber, customer_name, customer_contact, customer_phone, customer_email, customer_address, customer_type,
      invoice_date, due_date, subtotal, totalTax, totalDiscount, totalAmount, notes, req.user.id
    ]);
    
    // Insert invoice items
    for (const item of items) {
      await runQuery(`
        INSERT INTO sales_invoice_items (
          invoice_id, product_id, product_name, product_sku, quantity, unit_price, total_price,
          discount_percentage, discount_amount, tax_rate, tax_amount, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        invoiceResult.id, item.product_id, item.product_name, item.product_sku, item.quantity, item.unit_price,
        item.quantity * item.unit_price, item.discount_percentage, (item.quantity * item.unit_price * item.discount_percentage) / 100,
        item.tax_rate, ((item.quantity * item.unit_price * (1 - item.discount_percentage / 100)) * item.tax_rate) / 100, item.notes
      ]);
    }
    
    // Log audit trail
    await auditService.logAccountantActivity(
      req, 
      'insert', 
      'sales_invoices', 
      invoiceResult.id, 
      null, 
      {
        invoice_number: invoiceResult.invoice_number,
        customer_name,
        customer_contact,
        customer_phone,
        customer_email,
        customer_address,
        customer_type,
        invoice_date,
        due_date,
        subtotal,
        tax_amount: totalTax,
        discount_amount: totalDiscount,
        total_amount: totalAmount,
        notes,
        items_count: items.length
      }
    );
    
    res.json({
      success: true,
      message: `Invoice ${invoiceResult.invoice_number} created successfully`,
      data: {
        id: invoiceResult.id,
        invoice_number: invoiceResult.invoice_number,
        total_amount: totalAmount
      }
    });
  } catch (error) {
    console.error('Error creating sales invoice:', error);
    res.status(500).json({
      error: 'Failed to create sales invoice',
      details: error.message
    });
  }
});

// =============================================
// PROFIT & LOSS REPORTS
// =============================================

router.get('/accounting/profit-loss-report', authenticateToken, requireAccountant, async (req, res) => {
  try {
    const { runQuery } = require('../config/database');
    const { start_date, end_date } = req.query;
    
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = end_date || new Date().toISOString().split('T')[0];
    
    // Get sales data
    const salesData = await runQuery(`
      SELECT 
        SUM(total_amount) as total_revenue,
        SUM(paid_amount) as paid_revenue,
        SUM(balance_amount) as outstanding_revenue,
        COUNT(*) as invoice_count
      FROM sales_invoices 
      WHERE invoice_date BETWEEN $1 AND $2
    `, [startDate, endDate]);
    
    // Get expenses data
    const expensesData = await runQuery(`
      SELECT 
        expense_category,
        SUM(amount) as total_amount
      FROM expenses 
      WHERE expense_date BETWEEN $1 AND $2
      GROUP BY expense_category
      ORDER BY total_amount DESC
    `, [startDate, endDate]);
    
    // Get purchases data
    const purchasesData = await runQuery(`
      SELECT 
        SUM(total_amount) as total_purchases,
        COUNT(*) as purchase_count
      FROM purchases 
      WHERE purchase_date BETWEEN $1 AND $2
    `, [startDate, endDate]);
    
    const totalRevenue = parseFloat(salesData[0].total_revenue || 0);
    const totalExpenses = expensesData.reduce((sum, exp) => sum + parseFloat(exp.total_amount), 0);
    const totalPurchases = parseFloat(purchasesData[0].total_purchases || 0);
    const grossProfit = totalRevenue - totalPurchases;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    res.json({
      success: true,
      message: `Profit & Loss Report for ${startDate} to ${endDate}`,
      report: {
        period: { start_date: startDate, end_date: endDate },
        revenue: {
          total_revenue: totalRevenue,
          paid_revenue: parseFloat(salesData[0].paid_revenue || 0),
          outstanding_revenue: parseFloat(salesData[0].outstanding_revenue || 0),
          invoice_count: parseInt(salesData[0].invoice_count || 0)
        },
        purchases: {
          total_purchases: totalPurchases,
          purchase_count: parseInt(purchasesData[0].purchase_count || 0)
        },
        expenses: {
          total_expenses: totalExpenses,
          by_category: expensesData
        },
        profit: {
          gross_profit: grossProfit,
          net_profit: netProfit,
          profit_margin: profitMargin
        }
      }
    });
  } catch (error) {
    console.error('Error generating profit & loss report:', error);
    res.status(500).json({
      error: 'Failed to generate profit & loss report',
      details: error.message
    });
  }
});

// =============================================
// GATEKEEPER ROUTES
// Warehouse gate control - can only add inbound/outbound stock movements
// =============================================

router.get('/gatekeeper/warehouse-dashboard', authenticateToken, requireGatekeeper, (req, res) => {
  res.json({ 
    message: `Welcome, Gatekeeper ${req.user.name}! Warehouse gate control dashboard.`,
    user: req.user,
    data: {
      pending_trucks: 3,
      today_movements: 15,
      warehouse_status: 'Active',
      current_capacity: '75%'
    }
  });
});

router.post('/gatekeeper/truck-entry', authenticateToken, requireGatekeeper, (req, res) => {
  res.json({ 
    message: `Gatekeeper ${req.user.name} recorded truck entry.`,
    user: req.user,
    truckId: 'TRUCK-001',
    driver: 'Ahmed Khan',
    license_plate: 'KHI-1234',
    products: ['Protein Nimko 100g', 'Salted Chips 50g'],
    entry_time: new Date().toISOString()
  });
});

router.post('/gatekeeper/truck-exit', authenticateToken, requireGatekeeper, (req, res) => {
  res.json({ 
    message: `Gatekeeper ${req.user.name} recorded truck exit.`,
    user: req.user,
    truckId: 'TRUCK-001',
    driver: 'Ahmed Khan',
    license_plate: 'KHI-1234',
    destination: 'Karachi Distribution Center',
    exit_time: new Date().toISOString()
  });
});

// Stock In endpoint - for recording inbound stock movements
router.post('/gatekeeper/stock-in', authenticateToken, requireGatekeeper, async (req, res) => {
  try {
    const { 
      product_id, 
      warehouse_id, 
      quantity, 
      batch_number, 
      vehicle_number, 
      driver_name, 
      source,
      unit_cost,
      notes 
    } = req.body;

    // Validate required fields
    if (!product_id || !warehouse_id || !quantity || !batch_number || !vehicle_number || !driver_name) {
      return res.status(400).json({
        error: 'Missing required fields: product_id, warehouse_id, quantity, batch_number, vehicle_number, driver_name'
      });
    }

    // Generate unique gate pass number
    const gatePassNumber = `GP-IN-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    // Calculate total cost if unit cost provided
    const totalCost = unit_cost ? (unit_cost * quantity) : null;

    // Insert stock movement record
    const { runQuery } = require('../config/database');
    const result = await runQuery(`
      INSERT INTO stock_movements (
        movement_type, reference_type, reference_id, product_id, warehouse_id, 
        quantity, unit_cost, total_cost, batch_number, vehicle_number, 
        driver_name, gate_pass_number, entry_time, source, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id, gate_pass_number, entry_time
    `, [
      'in', 'gatekeeper_entry', gatePassNumber, product_id, warehouse_id,
      quantity, unit_cost, totalCost, batch_number, vehicle_number,
      driver_name, gatePassNumber, new Date(), source, notes, req.user.id
    ]);

    // Log audit trail
    await auditService.logGatekeeperActivity(
      req, 
      'insert', 
      'stock_movements', 
      result.id, 
      null, 
      {
        movement_type: 'in',
        product_id,
        warehouse_id,
        quantity,
        batch_number,
        vehicle_number,
        driver_name,
        source,
        unit_cost,
        total_cost: totalCost,
        gate_pass_number: result.gate_pass_number
      }
    );

    res.json({
      success: true,
      message: `Gatekeeper ${req.user.name} recorded inbound stock movement.`,
      user: req.user,
      movementId: result.id,
      gatePassNumber: result.gate_pass_number,
      entryTime: result.entry_time,
      data: {
        product_id,
        warehouse_id,
        quantity,
        batch_number,
        vehicle_number,
        driver_name,
        source,
        unit_cost,
        total_cost: totalCost
      }
    });
  } catch (error) {
    console.error('Error recording stock-in:', error);
    res.status(500).json({
      error: 'Failed to record stock movement',
      details: error.message
    });
  }
});

// Stock Out endpoint - for recording outbound stock movements
router.post('/gatekeeper/stock-out', authenticateToken, requireGatekeeper, async (req, res) => {
  try {
    const { 
      product_id, 
      warehouse_id, 
      quantity, 
      batch_number, 
      vehicle_number, 
      driver_name, 
      destination,
      unit_cost,
      notes 
    } = req.body;

    // Validate required fields
    if (!product_id || !warehouse_id || !quantity || !batch_number || !vehicle_number || !driver_name) {
      return res.status(400).json({
        error: 'Missing required fields: product_id, warehouse_id, quantity, batch_number, vehicle_number, driver_name'
      });
    }

    // Generate unique gate pass number
    const gatePassNumber = `GP-OUT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    // Calculate total cost if unit cost provided
    const totalCost = unit_cost ? (unit_cost * quantity) : null;

    // Insert stock movement record
    const { runQuery } = require('../config/database');
    const result = await runQuery(`
      INSERT INTO stock_movements (
        movement_type, reference_type, reference_id, product_id, warehouse_id, 
        quantity, unit_cost, total_cost, batch_number, vehicle_number, 
        driver_name, gate_pass_number, exit_time, destination, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id, gate_pass_number, exit_time
    `, [
      'out', 'gatekeeper_exit', gatePassNumber, product_id, warehouse_id,
      quantity, unit_cost, totalCost, batch_number, vehicle_number,
      driver_name, gatePassNumber, new Date(), destination, notes, req.user.id
    ]);

    // Log audit trail
    await auditService.logGatekeeperActivity(
      req, 
      'insert', 
      'stock_movements', 
      result.id, 
      null, 
      {
        movement_type: 'out',
        product_id,
        warehouse_id,
        quantity,
        batch_number,
        vehicle_number,
        driver_name,
        destination,
        unit_cost,
        total_cost: totalCost,
        gate_pass_number: result.gate_pass_number
      }
    );

    res.json({
      success: true,
      message: `Gatekeeper ${req.user.name} recorded outbound stock movement.`,
      user: req.user,
      movementId: result.id,
      gatePassNumber: result.gate_pass_number,
      exitTime: result.exit_time,
      data: {
        product_id,
        warehouse_id,
        quantity,
        batch_number,
        vehicle_number,
        driver_name,
        destination,
        unit_cost,
        total_cost: totalCost
      }
    });
  } catch (error) {
    console.error('Error recording stock-out:', error);
    res.status(500).json({
      error: 'Failed to record stock movement',
      details: error.message
    });
  }
});

// Generate PDF Gate Pass endpoint
router.get('/gatekeeper/gate-pass/:movementId', authenticateToken, requireGatekeeper, async (req, res) => {
  try {
    const { movementId } = req.params;
    
    if (!movementId) {
      return res.status(400).json({
        error: 'Movement ID is required'
      });
    }

    // Generate PDF
    const pdfBuffer = await pdfGenerator.generateGatePassFromMovementId(movementId);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="gate-pass-${movementId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send PDF buffer
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating gate pass PDF:', error);
    res.status(500).json({
      error: 'Failed to generate gate pass PDF',
      details: error.message
    });
  }
});

router.get('/gatekeeper/movement-history', authenticateToken, requireGatekeeper, (req, res) => {
  res.json({ 
    message: `Gatekeeper ${req.user.name} viewing movement history.`,
    user: req.user,
    movements: [
      { id: 'INB-001', type: 'Inbound', product: 'Protein Nimko 100g', quantity: 500, time: '09:30' },
      { id: 'OUT-001', type: 'Outbound', product: 'Salted Chips 50g', quantity: 200, time: '11:15' },
      { id: 'INB-002', type: 'Inbound', product: 'Spicy Nimko Mix', quantity: 300, time: '14:20' }
    ]
  });
});

router.get('/gatekeeper/pending-movements', authenticateToken, requireGatekeeper, (req, res) => {
  res.json({ 
    message: `Gatekeeper ${req.user.name} viewing pending movements.`,
    user: req.user,
    pending: [
      { id: 'PEND-001', type: 'Inbound', product: 'Protein Nimko 250g', quantity: 150, expected_time: '16:00' },
      { id: 'PEND-002', type: 'Outbound', product: 'Salted Chips 100g', quantity: 100, expected_time: '17:30' }
    ]
  });
});

// =============================================
// =============================================
// AUDIT LOGS ROUTES (ADMIN ONLY)
// =============================================

router.get('/audit-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      activity_type,
      activity_category,
      table_name,
      user_id,
      start_date,
      end_date,
      limit = 50,
      offset = 0
    } = req.query;

    const filters = {
      activityType: activity_type,
      activityCategory: activity_category,
      tableName: table_name,
      userId: user_id ? parseInt(user_id) : null,
      startDate: start_date,
      endDate: end_date,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const auditLogs = await auditService.getAuditLogs(filters);

    res.json({
      success: true,
      message: 'Audit logs retrieved successfully',
      data: {
        logs: auditLogs,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: auditLogs.length
        }
      }
    });
  } catch (error) {
    console.error('Error retrieving audit logs:', error);
    res.status(500).json({
      error: 'Failed to retrieve audit logs',
      details: error.message
    });
  }
});

router.get('/audit-logs/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { runQuery } = require('../config/database');
    const { start_date, end_date } = req.query;
    
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = end_date || new Date().toISOString().split('T')[0];

    // Get activity summary by type
    const activitySummary = await runQuery(`
      SELECT 
        activity_type,
        activity_category,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users
      FROM audit_logs 
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY activity_type, activity_category
      ORDER BY count DESC
    `, [startDate, endDate]);

    // Get user activity summary
    const userActivitySummary = await runQuery(`
      SELECT 
        u.name as user_name,
        u.role,
        al.activity_type,
        COUNT(*) as activity_count
      FROM audit_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.created_at BETWEEN $1 AND $2
      GROUP BY u.id, u.name, u.role, al.activity_type
      ORDER BY activity_count DESC
    `, [startDate, endDate]);

    // Get daily activity trend
    const dailyTrend = await runQuery(`
      SELECT 
        DATE(created_at) as date,
        activity_type,
        COUNT(*) as count
      FROM audit_logs 
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY DATE(created_at), activity_type
      ORDER BY date ASC
    `, [startDate, endDate]);

    res.json({
      success: true,
      message: 'Audit logs summary retrieved successfully',
      data: {
        period: { start_date: startDate, end_date: endDate },
        activitySummary,
        userActivitySummary,
        dailyTrend
      }
    });
  } catch (error) {
    console.error('Error retrieving audit logs summary:', error);
    res.status(500).json({
      error: 'Failed to retrieve audit logs summary',
      details: error.message
    });
  }
});

// SHARED ROUTES (Multiple roles can access)
// =============================================

router.get('/shared/product-info', authenticateToken, requireReadOnlyAccess, (req, res) => {
  res.json({
    message: `Hello ${req.user.name}! You can view product information.`,
    user: req.user,
    products: [
      { name: 'Protein Nimko 100g', sku: 'PKF-PN-100G-001', price: '₹35' },
      { name: 'Protein Nimko 250g', sku: 'PKF-PN-250G-002', price: '₹75' },
      { name: 'Spicy Nimko Mix', sku: 'PKF-SNM-150G-003', price: '₹42' },
      { name: 'Salted Chips 50g', sku: 'PKF-SC-50G-004', price: '₹22' },
      { name: 'Salted Chips 100g', sku: 'PKF-SC-100G-005', price: '₹40' }
    ]
  });
});

router.get('/shared/warehouse-status', authenticateToken, requireReadOnlyAccess, (req, res) => {
  res.json({
    message: `Hello ${req.user.name}! You can view warehouse status.`,
    user: req.user,
    warehouses: [
      { name: 'Main Warehouse', status: 'Active', capacity: '80%', location: 'Karachi' },
      { name: 'Secondary Warehouse', status: 'Active', capacity: '65%', location: 'Lahore' }
    ]
  });
});

// =============================================
// GENERAL PROTECTED ROUTES
// =============================================

router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    message: 'User profile',
    data: {
      action: 'view_profile',
      description: 'View user profile information'
    },
    user: req.user
  });
});

router.get('/roles', authenticateToken, (req, res) => {
  const rolePermissions = {
    admin: ['Full system access - manage users, products, warehouses, all operations'],
    director: ['Read-only access to business performance dashboards and strategic reports'],
    accountant: ['Financial management - record sales, purchases, expenses and generate profit/loss reports'],
    gatekeeper: ['Warehouse gate control - add inbound/outbound stock movements (truck entry, goods leaving)']
  };

  res.json({
    message: 'Role information',
    data: {
      currentRole: req.user.role,
      permissions: rolePermissions[req.user.role] || [],
      allRoles: Object.keys(rolePermissions),
      company: 'Pakasian Foods Ltd'
    },
    user: req.user
  });
});

module.exports = router;