/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('audit_logs', function(table) {
    table.increments('id').primary();
    table.string('table_name', 100).notNullable();
    table.string('record_id', 100).notNullable();
    table.string('action', 20).notNullable(); // 'insert', 'update', 'delete'
    table.json('old_values').nullable(); // Previous values
    table.json('new_values').nullable(); // New values
    table.string('changed_fields', 500).nullable(); // Comma-separated field names
    table.integer('user_id').unsigned().nullable();
    table.string('ip_address', 45).nullable(); // IPv4/IPv6
    table.string('user_agent', 500).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');
    
    // Indexes
    table.index('table_name');
    table.index('record_id');
    table.index('action');
    table.index('user_id');
    table.index('created_at');
    table.index(['table_name', 'record_id']);
    table.index(['table_name', 'created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('audit_logs');
};
