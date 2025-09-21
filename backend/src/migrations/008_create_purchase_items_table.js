/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('purchase_items', function(table) {
    table.increments('id').primary();
    table.integer('purchase_id').unsigned().notNullable();
    table.string('item_name', 200).notNullable(); // Raw material name
    table.string('item_category', 100).notNullable(); // raw_material, packaging, equipment
    table.string('item_description', 500).nullable();
    table.string('unit_of_measure', 50).notNullable(); // kg, pieces, liters, etc.
    table.decimal('quantity', 15, 3).notNullable();
    table.decimal('unit_price', 15, 2).notNullable();
    table.decimal('total_price', 15, 2).notNullable();
    table.decimal('tax_rate', 5, 2).notNullable().defaultTo(0);
    table.decimal('tax_amount', 15, 2).notNullable().defaultTo(0);
    table.text('notes').nullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('purchase_id').references('id').inTable('purchases').onDelete('CASCADE');
    
    // Indexes
    table.index('purchase_id');
    table.index('item_category');
    table.index(['purchase_id', 'item_category']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('purchase_items');
};
