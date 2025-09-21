/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('trucks', function(table) {
    table.increments('id').primary();
    table.string('truck_number', 50).notNullable();
    table.string('driver_name', 255).notNullable();
    table.string('driver_cnic', 20).notNullable();
    table.string('entry_type', 10).notNullable(); // IN/OUT
    table.timestamp('entry_time').notNullable();
    table.timestamp('exit_time').nullable();
    table.string('purpose', 100).notNullable(); // Raw Material In, Finished Goods Out, Visitor, Other
    table.text('remarks').nullable();
    table.string('status', 20).defaultTo('inside'); // inside, exited
    table.integer('created_by').unsigned().notNullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index('truck_number');
    table.index('entry_time');
    table.index('status');
    table.index('created_by');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('trucks');
};
