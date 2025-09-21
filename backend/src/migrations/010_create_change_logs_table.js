/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('change_logs', function(table) {
    table.increments('id').primary();
    table.string('entity_type', 100).notNullable(); // 'product', 'invoice', 'user', etc.
    table.string('entity_id', 100).notNullable();
    table.string('change_type', 50).notNullable(); // 'create', 'update', 'delete', 'sync'
    table.json('change_data').nullable(); // Change details
    table.string('sync_status', 20).defaultTo('pending'); // 'pending', 'synced', 'failed'
    table.string('sync_target', 100).nullable(); // Target system identifier
    table.timestamp('sync_date').nullable();
    table.text('sync_error').nullable();
    table.integer('retry_count').defaultTo(0);
    table.timestamp('next_retry_at').nullable();
    table.integer('created_by').unsigned().nullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('created_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Indexes
    table.index('entity_type');
    table.index('entity_id');
    table.index('change_type');
    table.index('sync_status');
    table.index('sync_target');
    table.index('created_by');
    table.index('created_at');
    table.index('next_retry_at');
    table.index(['entity_type', 'entity_id']);
    table.index(['sync_status', 'next_retry_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('change_logs');
};
