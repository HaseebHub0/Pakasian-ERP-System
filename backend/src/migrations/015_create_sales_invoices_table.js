exports.up = function(knex) {
  return knex.schema.createTable('sales_invoices', function(table) {
    table.increments('id').primary();
    table.string('invoice_number').notNullable().unique();
    table.string('customer_name').notNullable();
    table.string('product_name').notNullable();
    table.decimal('quantity', 10, 2).notNullable();
    table.string('unit').notNullable().defaultTo('pieces');
    table.decimal('sale_price', 10, 2).notNullable();
    table.decimal('total_amount', 10, 2).notNullable();
    table.date('sale_date').notNullable();
    table.text('description');
    table.integer('created_by').unsigned();
    table.timestamps(true, true);
    
    table.foreign('created_by').references('id').inTable('users');
    table.index(['customer_name', 'sale_date']);
    table.index(['product_name']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('sales_invoices');
};
