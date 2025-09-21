/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('warehouses').del();
  
  // Inserts seed entries
  await knex('warehouses').insert([
    {
      id: 1,
      name: 'Main Warehouse',
      code: 'WH001',
      address: '100 Industrial Blvd',
      city: 'Tech City',
      state: 'California',
      country: 'USA',
      postal_code: '90210',
      phone: '+1-555-1001',
      email: 'main@warehouse.com',
      manager_id: 2, // John Manager
      capacity: 50000.00,
      capacity_unit: 'sqft',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 2,
      name: 'Secondary Warehouse',
      code: 'WH002',
      address: '200 Distribution Drive',
      city: 'Business District',
      state: 'California',
      country: 'USA',
      postal_code: '90211',
      phone: '+1-555-1002',
      email: 'secondary@warehouse.com',
      manager_id: 2, // John Manager
      capacity: 30000.00,
      capacity_unit: 'sqft',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);
};
