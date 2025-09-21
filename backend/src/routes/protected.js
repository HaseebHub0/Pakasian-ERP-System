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

router.get('/director/executive-dashboard', authenticateToken, requireDirector, (req, res) => {
  res.json({ 
    message: `Welcome, Director ${req.user.name}! Executive dashboard - read-only access.`,
    user: req.user,
    data: { 
      revenue: '₹50M', 
      profit: '₹8M', 
      production_volume: '2.5M packets',
      market_share: '15%',
      employee_count: 150,
      customer_satisfaction: '4.2/5'
    }
  });
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

router.get('/accounting/financial-reports', authenticateToken, requireAccountant, (req, res) => {
  res.json({ 
    message: `Welcome, Accountant ${req.user.name}! Financial reports access.`,
    user: req.user,
    reports: ['Balance Sheet', 'Income Statement', 'Cash Flow Statement', 'Profit & Loss', 'Trial Balance']
  });
});

router.post('/accounting/record-sale', authenticateToken, requireAccountant, (req, res) => {
  res.json({ 
    message: `Accountant ${req.user.name} recorded a sale.`,
    user: req.user,
    saleId: 'SALE-2024-001',
    amount: '₹15,000',
    customer: 'Retail Store Chain',
    products: ['Protein Nimko 100g', 'Salted Chips 50g']
  });
});

router.post('/accounting/record-purchase', authenticateToken, requireAccountant, (req, res) => {
  res.json({ 
    message: `Accountant ${req.user.name} recorded a purchase.`,
    user: req.user,
    purchaseId: 'PUR-2024-001',
    amount: '₹8,500',
    supplier: 'Raw Material Supplier',
    items: ['Flour', 'Spices', 'Packaging Materials']
  });
});

router.post('/accounting/record-expense', authenticateToken, requireAccountant, (req, res) => {
  res.json({ 
    message: `Accountant ${req.user.name} recorded an expense.`,
    user: req.user,
    expenseId: 'EXP-2024-001',
    amount: '₹2,300',
    category: 'Utilities',
    description: 'Electricity bill for production facility'
  });
});

router.get('/accounting/profit-loss-report', authenticateToken, requireAccountant, (req, res) => {
  res.json({ 
    message: `Accountant ${req.user.name} generated profit/loss report.`,
    user: req.user,
    report: {
      total_revenue: '₹50M',
      total_expenses: '₹42M',
      net_profit: '₹8M',
      profit_margin: '16%',
      gross_profit: '₹12M',
      operating_expenses: '₹30M'
    }
  });
});

router.get('/accounting/invoices', authenticateToken, requireAccountant, (req, res) => {
  res.json({ 
    message: `Accountant ${req.user.name} managing invoices.`,
    user: req.user,
    invoices: [
      { id: 'INV-001', customer: 'Retail Store A', amount: '₹15,000', status: 'Paid' },
      { id: 'INV-002', customer: 'Retail Store B', amount: '₹22,500', status: 'Pending' }
    ]
  });
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

router.post('/gatekeeper/goods-inbound', authenticateToken, requireGatekeeper, (req, res) => {
  res.json({ 
    message: `Gatekeeper ${req.user.name} recorded inbound goods movement.`,
    user: req.user,
    movementId: 'INB-2024-001',
    product: 'Protein Nimko 100g',
    quantity: 500,
    supplier: 'Pakasian Foods Ltd',
    batch_number: 'PKF-PN-100G-2024-001',
    expiry_date: '2025-06-15'
  });
});

router.post('/gatekeeper/goods-outbound', authenticateToken, requireGatekeeper, (req, res) => {
  res.json({ 
    message: `Gatekeeper ${req.user.name} recorded outbound goods movement.`,
    user: req.user,
    movementId: 'OUT-2024-001',
    product: 'Salted Chips 50g',
    quantity: 200,
    destination: 'Retail Store Chain',
    customer: 'SuperMart Karachi'
  });
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