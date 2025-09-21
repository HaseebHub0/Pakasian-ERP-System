exports.up = function(knex) {
  return knex.schema.createTable('purchases', function(table) {
    table.increments('id').primary();
    table.string('invoice_number').notNullable().unique();
    table.string('supplier_name').notNullable();
    table.string('product_name').notNullable();
    table.decimal('quantity', 10, 2).notNullable();
    table.string('unit').notNullable().defaultTo('kg');
    table.decimal('unit_cost', 10, 2).notNullable();
    table.decimal('total_cost', 10, 2).notNullable();
    table.date('purchase_date').notNullable();
    table.text('description');
    table.integer('created_by').unsigned();
    table.timestamps(true, true);
    
    table.foreign('created_by').references('id').inTable('users');
    table.index(['supplier_name', 'purchase_date']);
    table.index(['product_name']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('purchases');
};
