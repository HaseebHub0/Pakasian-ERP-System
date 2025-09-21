/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('gate_logs', function(table) {
    table.increments('id').primary();
    table.integer('truck_id').unsigned().notNullable();
    table.string('action', 20).notNullable(); // entry, exit
    table.timestamp('action_time').notNullable();
    table.text('notes').nullable();
    table.integer('created_by').unsigned().notNullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('truck_id').references('id').inTable('trucks').onDelete('CASCADE');
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index('truck_id');
    table.index('action_time');
    table.index('created_by');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('gate_logs');
};
