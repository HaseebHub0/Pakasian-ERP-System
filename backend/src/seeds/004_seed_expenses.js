exports.seed = async function(knex) {
  // Delete existing entries
  await knex('expenses').del();
  
  // Get the accountant user ID
  const accountant = await knex('users').where('role', 'accountant').first();
  if (!accountant) {
    console.log('No accountant user found, skipping expense seeds');
    return;
  }

  // Generate expenses for the past week
  const today = new Date();
  const oneWeekAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
  
  const expenses = [];
  
  // Generate daily expenses for the past week
  for (let i = 0; i < 7; i++) {
    const expenseDate = new Date(oneWeekAgo.getTime() + (i * 24 * 60 * 60 * 1000));
    const dayOfWeek = expenseDate.getDay();
    
    // Skip weekends for some expenses
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Daily electricity bill
    expenses.push({
      expense_number: `EXP-2024-${String(expenseDate.getDate()).padStart(2, '0')}${String(expenseDate.getMonth() + 1).padStart(2, '0')}-001`,
      expense_category: 'utilities',
      expense_type: 'electricity',
      description: 'Daily electricity bill for production facility',
      amount: 2500.00 + (Math.random() * 500), // Random variation
      expense_date: expenseDate,
      payment_method: 'bank_transfer',
      payment_status: 'paid',
      vendor_name: 'Karachi Electric Supply Company',
      vendor_contact: 'KESC Customer Service',
      reference_number: `KESC-${expenseDate.getFullYear()}${String(expenseDate.getMonth() + 1).padStart(2, '0')}${String(expenseDate.getDate()).padStart(2, '0')}`,
      notes: 'Production facility electricity consumption',
      created_by: accountant.id,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });
    
    // Daily gas bill
    expenses.push({
      expense_number: `EXP-2024-${String(expenseDate.getDate()).padStart(2, '0')}${String(expenseDate.getMonth() + 1).padStart(2, '0')}-002`,
      expense_category: 'utilities',
      expense_type: 'gas',
      description: 'Daily gas bill for cooking and heating',
      amount: 1800.00 + (Math.random() * 300),
      expense_date: expenseDate,
      payment_method: 'bank_transfer',
      payment_status: 'paid',
      vendor_name: 'Sui Southern Gas Company',
      vendor_contact: 'SSGC Customer Service',
      reference_number: `SSGC-${expenseDate.getFullYear()}${String(expenseDate.getMonth() + 1).padStart(2, '0')}${String(expenseDate.getDate()).padStart(2, '0')}`,
      notes: 'Industrial gas consumption',
      created_by: accountant.id,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });
    
    // Daily water bill
    expenses.push({
      expense_number: `EXP-2024-${String(expenseDate.getDate()).padStart(2, '0')}${String(expenseDate.getMonth() + 1).padStart(2, '0')}-003`,
      expense_category: 'utilities',
      expense_type: 'water',
      description: 'Daily water bill for production and cleaning',
      amount: 800.00 + (Math.random() * 200),
      expense_date: expenseDate,
      payment_method: 'bank_transfer',
      payment_status: 'paid',
      vendor_name: 'Karachi Water & Sewerage Board',
      vendor_contact: 'KWSB Customer Service',
      reference_number: `KWSB-${expenseDate.getFullYear()}${String(expenseDate.getMonth() + 1).padStart(2, '0')}${String(expenseDate.getDate()).padStart(2, '0')}`,
      notes: 'Industrial water consumption',
      created_by: accountant.id,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });
    
    // Daily transport expenses (only on weekdays)
    if (!isWeekend) {
      expenses.push({
        expense_number: `EXP-2024-${String(expenseDate.getDate()).padStart(2, '0')}${String(expenseDate.getMonth() + 1).padStart(2, '0')}-004`,
        expense_category: 'transport',
        expense_type: 'fuel',
        description: 'Daily fuel expenses for delivery vehicles',
        amount: 1200.00 + (Math.random() * 400),
        expense_date: expenseDate,
        payment_method: 'cash',
        payment_status: 'paid',
        vendor_name: 'Shell Pakistan',
        vendor_contact: 'Shell Station Manager',
        reference_number: `SHELL-${expenseDate.getFullYear()}${String(expenseDate.getMonth() + 1).padStart(2, '0')}${String(expenseDate.getDate()).padStart(2, '0')}`,
        notes: 'Delivery vehicle fuel',
        created_by: accountant.id,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      });
    }
    
    // Daily maintenance expenses
    expenses.push({
      expense_number: `EXP-2024-${String(expenseDate.getDate()).padStart(2, '0')}${String(expenseDate.getMonth() + 1).padStart(2, '0')}-005`,
      expense_category: 'maintenance',
      expense_type: 'equipment_maintenance',
      description: 'Daily equipment maintenance and repairs',
      amount: 500.00 + (Math.random() * 300),
      expense_date: expenseDate,
      payment_method: 'cash',
      payment_status: 'paid',
      vendor_name: 'Industrial Maintenance Services',
      vendor_contact: 'Maintenance Team',
      reference_number: `MAINT-${expenseDate.getFullYear()}${String(expenseDate.getMonth() + 1).padStart(2, '0')}${String(expenseDate.getDate()).padStart(2, '0')}`,
      notes: 'Production equipment maintenance',
      created_by: accountant.id,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });
  }
  
  // Weekly salary expenses
  const salaryDate = new Date(oneWeekAgo.getTime() + (5 * 24 * 60 * 60 * 1000)); // Friday
  expenses.push({
    expense_number: `EXP-2024-${String(salaryDate.getDate()).padStart(2, '0')}${String(salaryDate.getMonth() + 1).padStart(2, '0')}-006`,
    expense_category: 'salaries',
    expense_type: 'weekly_salaries',
    description: 'Weekly salaries for production staff',
    amount: 45000.00,
    expense_date: salaryDate,
    payment_method: 'bank_transfer',
    payment_status: 'paid',
    vendor_name: 'Pakasian Foods Ltd',
    vendor_contact: 'HR Department',
    reference_number: `SALARY-${salaryDate.getFullYear()}${String(salaryDate.getMonth() + 1).padStart(2, '0')}${String(salaryDate.getDate()).padStart(2, '0')}`,
    notes: 'Weekly payroll for 15 production workers',
    created_by: accountant.id,
    created_at: knex.fn.now(),
    updated_at: knex.fn.now()
  });
  
  // Weekly office supplies
  const officeDate = new Date(oneWeekAgo.getTime() + (2 * 24 * 60 * 60 * 1000)); // Wednesday
  expenses.push({
    expense_number: `EXP-2024-${String(officeDate.getDate()).padStart(2, '0')}${String(officeDate.getMonth() + 1).padStart(2, '0')}-007`,
    expense_category: 'office_supplies',
    expense_type: 'stationery',
    description: 'Weekly office supplies and stationery',
    amount: 2500.00,
    expense_date: officeDate,
    payment_method: 'cash',
    payment_status: 'paid',
    vendor_name: 'Office Depot Karachi',
    vendor_contact: 'Office Depot Manager',
    reference_number: `OFFICE-${officeDate.getFullYear()}${String(officeDate.getMonth() + 1).padStart(2, '0')}${String(officeDate.getDate()).padStart(2, '0')}`,
    notes: 'Paper, pens, and office supplies',
    created_by: accountant.id,
    created_at: knex.fn.now(),
    updated_at: knex.fn.now()
  });
  
  // Insert all expenses
  await knex('expenses').insert(expenses);
};
