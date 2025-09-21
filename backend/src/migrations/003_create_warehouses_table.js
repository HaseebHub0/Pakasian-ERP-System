/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('warehouses', function(table) {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('code', 50).unique().notNullable();
    table.text('address').nullable();
    table.string('city', 100).nullable();
    table.string('state', 100).nullable();
    table.string('country', 100).nullable();
    table.string('postal_code', 20).nullable();
    table.string('phone', 20).nullable();
    table.string('email', 255).nullable();
    table.integer('manager_id').unsigned().nullable();
    table.decimal('capacity', 15, 2).nullable(); // Total capacity
    table.string('capacity_unit', 20).defaultTo('sqft'); // sqft, sqm, etc.
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('manager_id').references('id').inTable('users').onDelete('SET NULL');
    
    // Indexes
    table.index('code');
    table.index('manager_id');
    table.index('is_active');
    table.index('city');
    table.index('state');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('warehouses');
};
