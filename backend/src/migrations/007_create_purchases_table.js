/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('purchases', function(table) {
    table.increments('id').primary();
    table.string('purchase_number', 50).notNullable().unique(); // PO-2024-001
    table.string('supplier_name', 200).notNullable();
    table.string('supplier_contact', 200).nullable();
    table.string('supplier_phone', 50).nullable();
    table.string('supplier_email', 100).nullable();
    table.string('supplier_address', 500).nullable();
    table.date('purchase_date').notNullable();
    table.date('expected_delivery_date').nullable();
    table.date('actual_delivery_date').nullable();
    table.decimal('subtotal', 15, 2).notNullable().defaultTo(0);
    table.decimal('tax_amount', 15, 2).notNullable().defaultTo(0);
    table.decimal('discount_amount', 15, 2).notNullable().defaultTo(0);
    table.decimal('total_amount', 15, 2).notNullable().defaultTo(0);
    table.string('payment_status', 20).notNullable().defaultTo('pending'); // pending, paid, partial
    table.string('delivery_status', 20).notNullable().defaultTo('pending'); // pending, delivered, partial
    table.text('notes').nullable();
    table.integer('created_by').unsigned().notNullable();
    table.integer('approved_by').unsigned().nullable();
    table.timestamp('approved_at').nullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('approved_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Indexes
    table.index('purchase_number');
    table.index('supplier_name');
    table.index('purchase_date');
    table.index('payment_status');
    table.index('delivery_status');
    table.index('created_by');
    table.index(['purchase_date', 'supplier_name']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('purchases');
};
