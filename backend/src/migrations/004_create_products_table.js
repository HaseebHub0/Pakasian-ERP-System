/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('products', function(table) {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('sku', 100).unique().notNullable();
    table.string('barcode', 100).nullable();
    table.text('description').nullable();
    table.string('category', 100).nullable();
    table.string('brand', 100).nullable();
    table.string('unit', 50).defaultTo('pcs'); // pcs, kg, liter, etc.
    table.decimal('cost_price', 15, 2).nullable();
    table.decimal('selling_price', 15, 2).nullable();
    table.decimal('min_stock_level', 15, 2).defaultTo(0);
    table.decimal('max_stock_level', 15, 2).nullable();
    table.decimal('weight', 10, 3).nullable();
    table.string('weight_unit', 10).defaultTo('kg');
    table.decimal('length', 10, 2).nullable();
    table.decimal('width', 10, 2).nullable();
    table.decimal('height', 10, 2).nullable();
    table.string('dimension_unit', 10).defaultTo('cm');
    table.json('attributes').nullable(); // Store custom attributes as JSON
    table.string('image_url', 500).nullable();
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_taxable').defaultTo(true);
    table.decimal('tax_rate', 5, 2).defaultTo(0); // Tax percentage
    table.timestamps(true, true);
    
    // Indexes
    table.index('sku');
    table.index('barcode');
    table.index('category');
    table.index('brand');
    table.index('is_active');
    table.index('name');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('products');
};
