/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('expenses', function(table) {
    table.increments('id').primary();
    table.string('expense_number', 50).notNullable().unique(); // EXP-2024-001
    table.string('expense_category', 100).notNullable(); // utilities, salaries, transport, maintenance, etc.
    table.string('expense_type', 100).notNullable(); // electricity, gas, water, salary, fuel, etc.
    table.string('description', 500).notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.date('expense_date').notNullable();
    table.string('payment_method', 50).nullable(); // cash, bank_transfer, check, etc.
    table.string('payment_status', 20).notNullable().defaultTo('paid'); // paid, pending, overdue
    table.string('vendor_name', 200).nullable();
    table.string('vendor_contact', 200).nullable();
    table.string('reference_number', 100).nullable(); // bill number, receipt number, etc.
    table.text('notes').nullable();
    table.integer('created_by').unsigned().notNullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index('expense_number');
    table.index('expense_category');
    table.index('expense_type');
    table.index('expense_date');
    table.index('payment_status');
    table.index('created_by');
    table.index(['expense_date', 'expense_category']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('expenses');
};
