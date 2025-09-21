const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Delete existing entries
  await knex('purchase_items').del();
  await knex('purchases').del();
  
  // Get the accountant user ID
  const accountant = await knex('users').where('role', 'accountant').first();
  if (!accountant) {
    console.log('No accountant user found, skipping purchase seeds');
    return;
  }

  // Insert sample purchases for raw materials
  const purchases = await knex('purchases').insert([
    {
      id: 1,
      purchase_number: 'PO-2024-001',
      supplier_name: 'Karachi Fresh Produce',
      supplier_contact: 'Ahmed Ali',
      supplier_phone: '+92-300-1111111',
      supplier_email: 'ahmed@karachifresh.com',
      supplier_address: 'Saddar Market, Karachi, Pakistan',
      purchase_date: new Date('2024-01-15'),
      expected_delivery_date: new Date('2024-01-16'),
      actual_delivery_date: new Date('2024-01-16'),
      subtotal: 25000.00,
      tax_amount: 3750.00,
      discount_amount: 0.00,
      total_amount: 28750.00,
      payment_status: 'paid',
      delivery_status: 'delivered',
      notes: 'Fresh potatoes for chips production',
      created_by: accountant.id,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 2,
      purchase_number: 'PO-2024-002',
      supplier_name: 'Premium Spices Co.',
      supplier_contact: 'Hassan Khan',
      supplier_phone: '+92-300-2222222',
      supplier_email: 'hassan@premiumspices.com',
      supplier_address: 'Bohri Bazaar, Karachi, Pakistan',
      purchase_date: new Date('2024-01-16'),
      expected_delivery_date: new Date('2024-01-17'),
      actual_delivery_date: new Date('2024-01-17'),
      subtotal: 15000.00,
      tax_amount: 2250.00,
      discount_amount: 500.00,
      total_amount: 16750.00,
      payment_status: 'paid',
      delivery_status: 'delivered',
      notes: 'Spices for nimko production',
      created_by: accountant.id,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 3,
      purchase_number: 'PO-2024-003',
      supplier_name: 'Pakistani Packaging Ltd',
      supplier_contact: 'Usman Sheikh',
      supplier_phone: '+92-300-3333333',
      supplier_email: 'usman@pakpackaging.com',
      supplier_address: 'Industrial Area, Karachi, Pakistan',
      purchase_date: new Date('2024-01-17'),
      expected_delivery_date: new Date('2024-01-18'),
      actual_delivery_date: new Date('2024-01-18'),
      subtotal: 30000.00,
      tax_amount: 4500.00,
      discount_amount: 0.00,
      total_amount: 34500.00,
      payment_status: 'partial',
      delivery_status: 'delivered',
      notes: 'Foil bags and cartons for packaging',
      created_by: accountant.id,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 4,
      purchase_number: 'PO-2024-004',
      supplier_name: 'Fresh Chickpeas Supply',
      supplier_contact: 'Fatima Bibi',
      supplier_phone: '+92-300-4444444',
      supplier_email: 'fatima@freshchickpeas.com',
      supplier_address: 'Hyderabad, Sindh, Pakistan',
      purchase_date: new Date('2024-01-18'),
      expected_delivery_date: new Date('2024-01-19'),
      actual_delivery_date: new Date('2024-01-19'),
      subtotal: 18000.00,
      tax_amount: 2700.00,
      discount_amount: 0.00,
      total_amount: 20700.00,
      payment_status: 'paid',
      delivery_status: 'delivered',
      notes: 'Premium chickpeas for protein nimko',
      created_by: accountant.id,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 5,
      purchase_number: 'PO-2024-005',
      supplier_name: 'Cooking Oil Distributors',
      supplier_contact: 'Muhammad Saleem',
      supplier_phone: '+92-300-5555555',
      supplier_email: 'saleem@cookingoil.com',
      supplier_address: 'Korangi Industrial Area, Karachi, Pakistan',
      purchase_date: new Date('2024-01-19'),
      expected_delivery_date: new Date('2024-01-20'),
      actual_delivery_date: new Date('2024-01-20'),
      subtotal: 22000.00,
      tax_amount: 3300.00,
      discount_amount: 1000.00,
      total_amount: 24300.00,
      payment_status: 'pending',
      delivery_status: 'delivered',
      notes: 'Palm oil for frying and production',
      created_by: accountant.id,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]).returning('id');

  // Insert purchase items
  await knex('purchase_items').insert([
    // PO-2024-001 - Potatoes
    {
      purchase_id: 1,
      item_name: 'Fresh Potatoes',
      item_category: 'raw_material',
      item_description: 'Premium quality potatoes for chips production',
      unit_of_measure: 'kg',
      quantity: 1000.000,
      unit_price: 25.00,
      total_price: 25000.00,
      tax_rate: 15.00,
      tax_amount: 3750.00,
      notes: 'Grade A potatoes',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    // PO-2024-002 - Spices
    {
      purchase_id: 2,
      item_name: 'Red Chili Powder',
      item_category: 'raw_material',
      item_description: 'Hot red chili powder for spicy nimko',
      unit_of_measure: 'kg',
      quantity: 50.000,
      unit_price: 200.00,
      total_price: 10000.00,
      tax_rate: 15.00,
      tax_amount: 1500.00,
      notes: 'Extra hot variety',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      purchase_id: 2,
      item_name: 'Cumin Seeds',
      item_category: 'raw_material',
      item_description: 'Whole cumin seeds for flavoring',
      unit_of_measure: 'kg',
      quantity: 25.000,
      unit_price: 200.00,
      total_price: 5000.00,
      tax_rate: 15.00,
      tax_amount: 750.00,
      notes: 'Premium quality',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    // PO-2024-003 - Packaging
    {
      purchase_id: 3,
      item_name: 'Foil Bags 100g',
      item_category: 'packaging',
      item_description: 'Metallic foil bags for 100g products',
      unit_of_measure: 'pieces',
      quantity: 10000.000,
      unit_price: 2.00,
      total_price: 20000.00,
      tax_rate: 15.00,
      tax_amount: 3000.00,
      notes: 'Food grade foil',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      purchase_id: 3,
      item_name: 'Carton Boxes',
      item_category: 'packaging',
      item_description: 'Corrugated carton boxes for bulk packaging',
      unit_of_measure: 'pieces',
      quantity: 500.000,
      unit_price: 20.00,
      total_price: 10000.00,
      tax_rate: 15.00,
      tax_amount: 1500.00,
      notes: 'Recyclable material',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    // PO-2024-004 - Chickpeas
    {
      purchase_id: 4,
      item_name: 'Premium Chickpeas',
      item_category: 'raw_material',
      item_description: 'High protein chickpeas for protein nimko',
      unit_of_measure: 'kg',
      quantity: 500.000,
      unit_price: 36.00,
      total_price: 18000.00,
      tax_rate: 15.00,
      tax_amount: 2700.00,
      notes: 'Organic variety',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    // PO-2024-005 - Cooking Oil
    {
      purchase_id: 5,
      item_name: 'Palm Oil',
      item_category: 'raw_material',
      item_description: 'Refined palm oil for frying',
      unit_of_measure: 'liters',
      quantity: 200.000,
      unit_price: 110.00,
      total_price: 22000.00,
      tax_rate: 15.00,
      tax_amount: 3300.00,
      notes: 'Food grade refined oil',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);
};
