/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('stock_movements', function(table) {
    // Add new fields for gatekeeper operations
    table.string('batch_number', 100).nullable(); // Product batch number
    table.string('vehicle_number', 50).nullable(); // Vehicle/truck number
    table.string('driver_name', 100).nullable(); // Driver name
    table.string('gate_pass_number', 50).nullable(); // Unique gate pass number
    table.timestamp('entry_time').nullable(); // When goods entered
    table.timestamp('exit_time').nullable(); // When goods left
    table.string('destination', 200).nullable(); // Where goods are going (for outbound)
    table.string('source', 200).nullable(); // Where goods came from (for inbound)
    
    // Add indexes for new fields
    table.index('batch_number');
    table.index('vehicle_number');
    table.index('gate_pass_number');
    table.index('entry_time');
    table.index('exit_time');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('stock_movements', function(table) {
    // Remove indexes first
    table.dropIndex('batch_number');
    table.dropIndex('vehicle_number');
    table.dropIndex('gate_pass_number');
    table.dropIndex('entry_time');
    table.dropIndex('exit_time');
    
    // Remove columns
    table.dropColumn('batch_number');
    table.dropColumn('vehicle_number');
    table.dropColumn('driver_name');
    table.dropColumn('gate_pass_number');
    table.dropColumn('entry_time');
    table.dropColumn('exit_time');
    table.dropColumn('destination');
    table.dropColumn('source');
  });
};
