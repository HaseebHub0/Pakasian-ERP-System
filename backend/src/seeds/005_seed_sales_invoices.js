exports.seed = async function(knex) {
  // Delete existing entries
  await knex('sales_invoice_items').del();
  await knex('sales_invoices').del();
  
  // Get the accountant user ID and products
  const accountant = await knex('users').where('role', 'accountant').first();
  const products = await knex('products').select('id', 'name', 'sku', 'selling_price');
  
  if (!accountant || products.length === 0) {
    console.log('No accountant user or products found, skipping sales invoice seeds');
    return;
  }

  // Generate sales invoices for the past week
  const today = new Date();
  const oneWeekAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
  
  const invoices = [];
  const invoiceItems = [];
  let invoiceCounter = 1;
  
  // Generate daily sales for the past week
  for (let i = 0; i < 7; i++) {
    const invoiceDate = new Date(oneWeekAgo.getTime() + (i * 24 * 60 * 60 * 1000));
    const dayOfWeek = invoiceDate.getDay();
    
    // Skip weekends for some sales
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Generate 2-4 invoices per day
    const invoicesPerDay = isWeekend ? 1 : Math.floor(Math.random() * 3) + 2;
    
    for (let j = 0; j < invoicesPerDay; j++) {
      const invoiceNumber = `INV-2024-${String(invoiceCounter).padStart(3, '0')}`;
      const customerTypes = ['retail', 'wholesale', 'distributor'];
      const customerType = customerTypes[Math.floor(Math.random() * customerTypes.length)];
      
      // Customer data based on type
      let customerData;
      if (customerType === 'retail') {
        const retailCustomers = [
          { name: 'SuperMart Karachi', contact: 'Store Manager', phone: '+92-300-1111111', address: 'Gulshan-e-Iqbal, Karachi' },
          { name: 'Quick Store', contact: 'Owner', phone: '+92-300-2222222', address: 'Defence, Karachi' },
          { name: 'City Mart', contact: 'Manager', phone: '+92-300-3333333', address: 'North Nazimabad, Karachi' }
        ];
        customerData = retailCustomers[Math.floor(Math.random() * retailCustomers.length)];
      } else if (customerType === 'wholesale') {
        const wholesaleCustomers = [
          { name: 'Karachi Wholesale Center', contact: 'Wholesale Manager', phone: '+92-300-4444444', address: 'Saddar, Karachi' },
          { name: 'Bulk Distributors', contact: 'Sales Manager', phone: '+92-300-5555555', address: 'Industrial Area, Karachi' }
        ];
        customerData = wholesaleCustomers[Math.floor(Math.random() * wholesaleCustomers.length)];
      } else {
        const distributorCustomers = [
          { name: 'Sindh Food Distributors', contact: 'Regional Manager', phone: '+92-300-6666666', address: 'Hyderabad, Sindh' },
          { name: 'Punjab Distribution Network', contact: 'Area Manager', phone: '+92-300-7777777', address: 'Lahore, Punjab' }
        ];
        customerData = distributorCustomers[Math.floor(Math.random() * distributorCustomers.length)];
      }
      
      // Calculate pricing based on customer type
      let discountPercentage = 0;
      if (customerType === 'wholesale') discountPercentage = 10;
      if (customerType === 'distributor') discountPercentage = 15;
      
      // Select random products (1-3 products per invoice)
      const numProducts = Math.floor(Math.random() * 3) + 1;
      const selectedProducts = [];
      for (let k = 0; k < numProducts; k++) {
        const product = products[Math.floor(Math.random() * products.length)];
        if (!selectedProducts.find(p => p.id === product.id)) {
          selectedProducts.push(product);
        }
      }
      
      // Calculate invoice totals
      let subtotal = 0;
      const items = [];
      
      selectedProducts.forEach(product => {
        const quantity = Math.floor(Math.random() * 50) + 10; // 10-60 units
        const unitPrice = product.selling_price;
        const totalPrice = quantity * unitPrice;
        const discountAmount = (totalPrice * discountPercentage) / 100;
        const finalPrice = totalPrice - discountAmount;
        const taxAmount = (finalPrice * 15) / 100; // 15% tax
        
        subtotal += finalPrice;
        
        items.push({
          invoice_id: invoiceCounter,
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          quantity: quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
          discount_percentage: discountPercentage,
          discount_amount: discountAmount,
          tax_rate: 15.00,
          tax_amount: taxAmount,
          notes: `${customerType} customer discount`,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        });
      });
      
      const totalDiscount = subtotal * discountPercentage / 100;
      const taxAmount = (subtotal * 15) / 100;
      const totalAmount = subtotal + taxAmount;
      
      // Payment status (most are paid, some partial/pending)
      const paymentStatuses = ['paid', 'paid', 'paid', 'partial', 'pending'];
      const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
      const paidAmount = paymentStatus === 'paid' ? totalAmount : 
                        paymentStatus === 'partial' ? totalAmount * 0.5 : 0;
      
      invoices.push({
        id: invoiceCounter,
        invoice_number: invoiceNumber,
        customer_name: customerData.name,
        customer_contact: customerData.contact,
        customer_phone: customerData.phone,
        customer_address: customerData.address,
        customer_type: customerType,
        invoice_date: invoiceDate,
        due_date: new Date(invoiceDate.getTime() + (30 * 24 * 60 * 60 * 1000)), // 30 days
        subtotal: subtotal,
        tax_amount: taxAmount,
        discount_amount: totalDiscount,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        balance_amount: totalAmount - paidAmount,
        payment_status: paymentStatus,
        delivery_status: paymentStatus === 'paid' ? 'delivered' : 'pending',
        notes: `${customerType} customer order`,
        created_by: accountant.id,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      });
      
      invoiceItems.push(...items);
      invoiceCounter++;
    }
  }
  
  // Insert invoices and items
  await knex('sales_invoices').insert(invoices);
  await knex('sales_invoice_items').insert(invoiceItems);
};
