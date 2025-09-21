/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('sales_invoices', function(table) {
    table.increments('id').primary();
    table.string('invoice_number', 50).notNullable().unique(); // INV-2024-001
    table.string('customer_name', 200).notNullable();
    table.string('customer_contact', 200).nullable();
    table.string('customer_phone', 50).nullable();
    table.string('customer_email', 100).nullable();
    table.string('customer_address', 500).nullable();
    table.string('customer_type', 50).notNullable().defaultTo('retail'); // retail, wholesale, distributor
    table.date('invoice_date').notNullable();
    table.date('due_date').nullable();
    table.decimal('subtotal', 15, 2).notNullable().defaultTo(0);
    table.decimal('tax_amount', 15, 2).notNullable().defaultTo(0);
    table.decimal('discount_amount', 15, 2).notNullable().defaultTo(0);
    table.decimal('total_amount', 15, 2).notNullable().defaultTo(0);
    table.decimal('paid_amount', 15, 2).notNullable().defaultTo(0);
    table.decimal('balance_amount', 15, 2).notNullable().defaultTo(0);
    table.string('payment_status', 20).notNullable().defaultTo('pending'); // pending, paid, partial, overdue
    table.string('delivery_status', 20).notNullable().defaultTo('pending'); // pending, delivered, partial
    table.text('notes').nullable();
    table.integer('created_by').unsigned().notNullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index('invoice_number');
    table.index('customer_name');
    table.index('invoice_date');
    table.index('payment_status');
    table.index('delivery_status');
    table.index('customer_type');
    table.index('created_by');
    table.index(['invoice_date', 'customer_type']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('sales_invoices');
};
