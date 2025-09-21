/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('invoices', function(table) {
    table.increments('id').primary();
    table.string('invoice_number', 100).unique().notNullable();
    table.string('invoice_type', 20).notNullable(); // 'sales', 'purchase'
    table.string('status', 20).defaultTo('draft'); // 'draft', 'pending', 'paid', 'cancelled'
    table.integer('customer_id').unsigned().nullable(); // For sales invoices
    table.integer('supplier_id').unsigned().nullable(); // For purchase invoices
    table.integer('warehouse_id').unsigned().nullable();
    table.decimal('subtotal', 15, 2).defaultTo(0);
    table.decimal('tax_amount', 15, 2).defaultTo(0);
    table.decimal('discount_amount', 15, 2).defaultTo(0);
    table.decimal('total_amount', 15, 2).defaultTo(0);
    table.decimal('paid_amount', 15, 2).defaultTo(0);
    table.decimal('balance_amount', 15, 2).defaultTo(0);
    table.date('invoice_date').notNullable();
    table.date('due_date').nullable();
    table.date('payment_date').nullable();
    table.text('notes').nullable();
    table.text('terms_conditions').nullable();
    table.string('payment_method', 50).nullable();
    table.string('payment_reference', 100).nullable();
    table.integer('created_by').unsigned().notNullable();
    table.integer('approved_by').unsigned().nullable();
    table.timestamp('approved_at').nullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('customer_id').references('id').inTable('users').onDelete('SET NULL');
    table.foreign('supplier_id').references('id').inTable('users').onDelete('SET NULL');
    table.foreign('warehouse_id').references('id').inTable('warehouses').onDelete('SET NULL');
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('approved_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Indexes
    table.index('invoice_number');
    table.index('invoice_type');
    table.index('status');
    table.index('customer_id');
    table.index('supplier_id');
    table.index('warehouse_id');
    table.index('created_by');
    table.index('invoice_date');
    table.index('due_date');
    table.index(['invoice_type', 'status']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('invoices');
};
