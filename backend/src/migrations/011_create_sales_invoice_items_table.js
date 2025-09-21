/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('sales_invoice_items', function(table) {
    table.increments('id').primary();
    table.integer('invoice_id').unsigned().notNullable();
    table.integer('product_id').unsigned().notNullable();
    table.string('product_name', 200).notNullable(); // Store product name for historical reference
    table.string('product_sku', 100).notNullable(); // Store SKU for historical reference
    table.decimal('quantity', 15, 3).notNullable();
    table.decimal('unit_price', 15, 2).notNullable();
    table.decimal('total_price', 15, 2).notNullable();
    table.decimal('discount_percentage', 5, 2).notNullable().defaultTo(0);
    table.decimal('discount_amount', 15, 2).notNullable().defaultTo(0);
    table.decimal('tax_rate', 5, 2).notNullable().defaultTo(0);
    table.decimal('tax_amount', 15, 2).notNullable().defaultTo(0);
    table.text('notes').nullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('invoice_id').references('id').inTable('sales_invoices').onDelete('CASCADE');
    table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE');
    
    // Indexes
    table.index('invoice_id');
    table.index('product_id');
    table.index(['invoice_id', 'product_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('sales_invoice_items');
};
