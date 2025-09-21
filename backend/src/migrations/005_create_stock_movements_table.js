/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('stock_movements', function(table) {
    table.increments('id').primary();
    table.string('movement_type', 20).notNullable(); // 'in', 'out', 'transfer', 'adjustment'
    table.string('reference_type', 50).nullable(); // 'purchase', 'sale', 'transfer', 'adjustment'
    table.string('reference_id', 100).nullable(); // ID of the related document
    table.integer('product_id').unsigned().notNullable();
    table.integer('warehouse_id').unsigned().notNullable();
    table.decimal('quantity', 15, 3).notNullable();
    table.decimal('unit_cost', 15, 2).nullable();
    table.decimal('total_cost', 15, 2).nullable();
    table.text('notes').nullable();
    table.integer('created_by').unsigned().notNullable();
    table.timestamp('movement_date').defaultTo(knex.fn.now());
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
    table.foreign('warehouse_id').references('id').inTable('warehouses').onDelete('CASCADE');
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index('movement_type');
    table.index('reference_type');
    table.index('reference_id');
    table.index('product_id');
    table.index('warehouse_id');
    table.index('created_by');
    table.index('movement_date');
    table.index(['product_id', 'warehouse_id']);
    table.index(['movement_type', 'movement_date']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('stock_movements');
};
