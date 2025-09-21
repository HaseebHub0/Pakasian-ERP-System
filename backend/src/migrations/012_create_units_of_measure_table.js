/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('units_of_measure', function(table) {
    table.increments('id').primary();
    table.string('name', 100).unique().notNullable(); // 'grams', 'packets', 'cartons'
    table.string('symbol', 20).unique().notNullable(); // 'g', 'pkt', 'ctn'
    table.string('type', 50).notNullable(); // 'weight', 'count', 'volume'
    table.decimal('conversion_factor', 10, 4).defaultTo(1); // For unit conversions
    table.string('base_unit', 50).nullable(); // Reference to base unit
    table.text('description').nullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Indexes
    table.index('name');
    table.index('symbol');
    table.index('type');
    table.index('is_active');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('units_of_measure');
};
