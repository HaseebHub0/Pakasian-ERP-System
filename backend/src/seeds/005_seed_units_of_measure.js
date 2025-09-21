/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('units_of_measure').del();
  
  // Inserts seed entries
  await knex('units_of_measure').insert([
    {
      id: 1,
      name: 'Grams',
      symbol: 'g',
      type: 'weight',
      conversion_factor: 1.0000,
      base_unit: 'grams',
      description: 'Metric unit of weight measurement',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 2,
      name: 'Kilograms',
      symbol: 'kg',
      type: 'weight',
      conversion_factor: 1000.0000,
      base_unit: 'grams',
      description: 'Metric unit of weight measurement (1000 grams)',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 3,
      name: 'Packets',
      symbol: 'pkt',
      type: 'count',
      conversion_factor: 1.0000,
      base_unit: 'packets',
      description: 'Individual packet units',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 4,
      name: 'Cartons',
      symbol: 'ctn',
      type: 'count',
      conversion_factor: 1.0000,
      base_unit: 'cartons',
      description: 'Carton packaging units',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 5,
      name: 'Boxes',
      symbol: 'box',
      type: 'count',
      conversion_factor: 1.0000,
      base_unit: 'boxes',
      description: 'Box packaging units',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 6,
      name: 'Bags',
      symbol: 'bag',
      type: 'count',
      conversion_factor: 1.0000,
      base_unit: 'bags',
      description: 'Bag packaging units',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 7,
      name: 'Litres',
      symbol: 'L',
      type: 'volume',
      conversion_factor: 1.0000,
      base_unit: 'litres',
      description: 'Metric unit of volume measurement',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 8,
      name: 'Millilitres',
      symbol: 'ml',
      type: 'volume',
      conversion_factor: 0.0010,
      base_unit: 'litres',
      description: 'Metric unit of volume measurement (1/1000 litre)',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);
};
