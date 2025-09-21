const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del();
  
  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 12);
  const directorPassword = await bcrypt.hash('director123', 12);
  const accountantPassword = await bcrypt.hash('accountant123', 12);
  const gatekeeperPassword = await bcrypt.hash('gatekeeper123', 12);
  
  // Inserts seed entries for snacks manufacturing company
  await knex('users').insert([
    {
      id: 1,
      name: 'System Administrator',
      email: 'admin@pakasian.com',
      password: adminPassword,
      role: 'admin',
      phone: '+92-300-1234567',
      address: 'Pakasian Foods Ltd, Industrial Area, Karachi, Pakistan',
      is_active: true,
      last_login: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 2,
      name: 'Executive Director',
      email: 'director@pakasian.com',
      password: directorPassword,
      role: 'director',
      phone: '+92-300-1234568',
      address: 'Pakasian Foods Ltd, Executive Office, Karachi, Pakistan',
      is_active: true,
      last_login: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 3,
      name: 'Chief Accountant',
      email: 'accountant@pakasian.com',
      password: accountantPassword,
      role: 'accountant',
      phone: '+92-300-1234569',
      address: 'Pakasian Foods Ltd, Finance Department, Karachi, Pakistan',
      is_active: true,
      last_login: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 4,
      name: 'Warehouse Gatekeeper',
      email: 'gatekeeper@pakasian.com',
      password: gatekeeperPassword,
      role: 'gatekeeper',
      phone: '+92-300-1234570',
      address: 'Pakasian Foods Ltd, Warehouse Gate, Karachi, Pakistan',
      is_active: true,
      last_login: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);
};
