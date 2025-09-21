const fs = require('fs');
const path = require('path');
const { initializeDatabase, query, runQuery } = require('../config/database');

/**
 * Run all migrations in order
 */
async function runMigrations() {
  console.log('🚀 Starting ERP Database Migrations...\n');

  try {
    // Initialize database connection
    await initializeDatabase();
    console.log('✅ Database connection established\n');

    // Read and execute schema file
    const schemaPath = path.join(__dirname, '../schema/erp_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Creating database schema...');
    
    // Split SQL into individual statements and execute
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await runQuery(statement);
        } catch (error) {
          // Ignore errors for statements that might already exist
          if (!error.message.includes('already exists') && 
              !error.message.includes('duplicate key') &&
              !error.message.includes('relation') && 
              !error.message.includes('index')) {
            console.warn(`⚠️  Warning: ${error.message}`);
          }
        }
      }
    }

    console.log('✅ Database schema created successfully\n');

    // Run seed data
    console.log('🌱 Seeding database with sample data...');
    const seedPath = path.join(__dirname, '../schema/seed_data.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    
    const seedStatements = seedSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of seedStatements) {
      if (statement.trim()) {
        try {
          await runQuery(statement);
        } catch (error) {
          // Ignore errors for duplicate data
          if (!error.message.includes('duplicate key') && 
              !error.message.includes('already exists')) {
            console.warn(`⚠️  Warning: ${error.message}`);
          }
        }
      }
    }

    console.log('✅ Sample data seeded successfully\n');

    // Verify tables were created
    console.log('🔍 Verifying database structure...');
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📊 Created tables:');
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    console.log('\n🎉 Database migration completed successfully!');
    console.log('\n📝 Default login credentials:');
    console.log('   Admin: admin@erp.com / admin123');
    console.log('   Manager: manager@erp.com / manager123');
    console.log('   User: sales@erp.com / user123');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
