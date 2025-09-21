/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('products', function(table) {
    // Add new columns for food factory requirements
    table.string('batch_number', 50).nullable(); // Batch tracking for food safety
    table.date('expiry_date').nullable(); // Expiry date for perishable goods
    table.string('supplier_name', 255).nullable(); // Supplier information
    table.integer('unit_of_measure_id').unsigned().nullable(); // Reference to units_of_measure table
    table.string('product_category', 100).nullable(); // 'snacks', 'beverages', 'condiments'
    table.string('flavor', 100).nullable(); // 'spicy', 'salted', 'mixed'
    table.string('packaging_type', 100).nullable(); // 'bag', 'box', 'jar'
    table.decimal('net_weight', 10, 3).nullable(); // Net weight in base unit
    table.decimal('gross_weight', 10, 3).nullable(); // Gross weight including packaging
    table.string('nutrition_info', 500).nullable(); // Nutritional information
    table.string('ingredients', 1000).nullable(); // Ingredient list
    table.string('allergen_info', 500).nullable(); // Allergen warnings
    table.string('storage_conditions', 200).nullable(); // Storage requirements
    table.string('origin_country', 100).nullable(); // Country of origin
    table.string('manufacturing_date', 50).nullable(); // Manufacturing date
    table.boolean('is_perishable').defaultTo(false); // Perishable goods flag
    table.boolean('requires_cold_storage').defaultTo(false); // Cold storage requirement
    table.integer('shelf_life_days').nullable(); // Shelf life in days
    
    // Add foreign key constraint
    table.foreign('unit_of_measure_id').references('id').inTable('units_of_measure').onDelete('SET NULL');
    
    // Add indexes for new fields
    table.index('batch_number');
    table.index('expiry_date');
    table.index('supplier_name');
    table.index('unit_of_measure_id');
    table.index('product_category');
    table.index('flavor');
    table.index('is_perishable');
    table.index('requires_cold_storage');
    table.index(['batch_number', 'expiry_date']);
    table.index(['supplier_name', 'product_category']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('products', function(table) {
    // Drop foreign key constraint
    table.dropForeign('unit_of_measure_id');
    
    // Drop indexes
    table.dropIndex('batch_number');
    table.dropIndex('expiry_date');
    table.dropIndex('supplier_name');
    table.dropIndex('unit_of_measure_id');
    table.dropIndex('product_category');
    table.dropIndex('flavor');
    table.dropIndex('is_perishable');
    table.dropIndex('requires_cold_storage');
    table.dropIndex(['batch_number', 'expiry_date']);
    table.dropIndex(['supplier_name', 'product_category']);
    
    // Drop columns
    table.dropColumn('batch_number');
    table.dropColumn('expiry_date');
    table.dropColumn('supplier_name');
    table.dropColumn('unit_of_measure_id');
    table.dropColumn('product_category');
    table.dropColumn('flavor');
    table.dropColumn('packaging_type');
    table.dropColumn('net_weight');
    table.dropColumn('gross_weight');
    table.dropColumn('nutrition_info');
    table.dropColumn('ingredients');
    table.dropColumn('allergen_info');
    table.dropColumn('storage_conditions');
    table.dropColumn('origin_country');
    table.dropColumn('manufacturing_date');
    table.dropColumn('is_perishable');
    table.dropColumn('requires_cold_storage');
    table.dropColumn('shelf_life_days');
  });
};
