/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('roles').del();
  
  // Inserts seed entries for snacks manufacturing company
  await knex('roles').insert([
    {
      id: 1,
      name: 'Admin',
      slug: 'admin',
      description: 'Full system access - can manage users, products, warehouses, and all operations',
      permissions: JSON.stringify([
        'users.create', 'users.read', 'users.update', 'users.delete',
        'products.create', 'products.read', 'products.update', 'products.delete',
        'warehouses.create', 'warehouses.read', 'warehouses.update', 'warehouses.delete',
        'stock_movements.create', 'stock_movements.read', 'stock_movements.update', 'stock_movements.delete',
        'invoices.create', 'invoices.read', 'invoices.update', 'invoices.delete',
        'ledger.read', 'ledger.create', 'ledger.update',
        'reports.read', 'reports.create', 'reports.update',
        'settings.update', 'system.admin', 'dashboard.admin'
      ]),
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 2,
      name: 'Director',
      slug: 'director',
      description: 'Executive level - read-only access to business performance dashboards and strategic reports',
      permissions: JSON.stringify([
        'products.read',
        'warehouses.read',
        'stock_movements.read',
        'invoices.read',
        'ledger.read',
        'reports.read',
        'dashboard.director', 'dashboard.executive', 'dashboard.strategic',
        'reports.strategic', 'reports.executive', 'reports.performance'
      ]),
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 3,
      name: 'Accountant',
      slug: 'accountant',
      description: 'Financial management - can record sales, purchases, expenses and generate profit/loss reports',
      permissions: JSON.stringify([
        'products.read',
        'warehouses.read',
        'stock_movements.read',
        'invoices.create', 'invoices.read', 'invoices.update',
        'ledger.create', 'ledger.read', 'ledger.update',
        'reports.read', 'reports.create', 'reports.financial',
        'dashboard.accounting', 'dashboard.financial',
        'expenses.create', 'expenses.read', 'expenses.update',
        'sales.create', 'sales.read', 'sales.update',
        'purchases.create', 'purchases.read', 'purchases.update'
      ]),
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 4,
      name: 'Gatekeeper',
      slug: 'gatekeeper',
      description: 'Warehouse gate control - can only add inbound/outbound stock movements (truck entry, goods leaving)',
      permissions: JSON.stringify([
        'products.read',
        'warehouses.read',
        'stock_movements.create', 'stock_movements.read',
        'dashboard.gatekeeper', 'dashboard.warehouse',
        'truck.entry', 'truck.exit', 'goods.movement',
        'reports.read', 'reports.warehouse', 'reports.movement'
      ]),
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);
};
