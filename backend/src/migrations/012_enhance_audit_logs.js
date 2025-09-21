/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('audit_logs', function(table) {
    // Add new fields for enhanced audit logging
    table.string('activity_type', 50).nullable(); // 'gatekeeper_entry', 'accountant_transaction', 'admin_action'
    table.string('activity_category', 50).nullable(); // 'stock_movement', 'financial', 'user_management', 'product_management'
    table.text('activity_description').nullable(); // Human-readable description
    table.json('sensitive_data').nullable(); // Encrypted sensitive information
    table.string('encryption_key_id', 100).nullable(); // Key identifier for decryption
    table.string('session_id', 100).nullable(); // Session tracking
    table.string('request_id', 100).nullable(); // Request tracking
    table.json('metadata').nullable(); // Additional context data
    
    // Add indexes for new fields
    table.index('activity_type');
    table.index('activity_category');
    table.index('session_id');
    table.index('request_id');
    table.index(['activity_type', 'activity_category']);
    table.index(['activity_type', 'created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('audit_logs', function(table) {
    // Remove indexes first
    table.dropIndex('activity_type');
    table.dropIndex('activity_category');
    table.dropIndex('session_id');
    table.dropIndex('request_id');
    table.dropIndex(['activity_type', 'activity_category']);
    table.dropIndex(['activity_type', 'created_at']);
    
    // Remove columns
    table.dropColumn('activity_type');
    table.dropColumn('activity_category');
    table.dropColumn('activity_description');
    table.dropColumn('sensitive_data');
    table.dropColumn('encryption_key_id');
    table.dropColumn('session_id');
    table.dropColumn('request_id');
    table.dropColumn('metadata');
  });
};
