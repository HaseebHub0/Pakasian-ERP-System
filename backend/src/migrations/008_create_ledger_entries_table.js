/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('ledger_entries', function(table) {
    table.increments('id').primary();
    table.string('entry_type', 20).notNullable(); // 'debit', 'credit'
    table.string('account_code', 50).notNullable(); // Chart of accounts code
    table.string('account_name', 255).notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.string('reference_type', 50).nullable(); // 'invoice', 'payment', 'adjustment'
    table.string('reference_id', 100).nullable();
    table.text('description').nullable();
    table.date('entry_date').notNullable();
    table.integer('created_by').unsigned().notNullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index('entry_type');
    table.index('account_code');
    table.index('reference_type');
    table.index('reference_id');
    table.index('created_by');
    table.index('entry_date');
    table.index(['account_code', 'entry_date']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('ledger_entries');
};
