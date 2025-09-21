// Test setup file
const { initializeDatabase } = require('../config/database');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.DB_TYPE = 'sqlite';

// Global test setup
beforeAll(async () => {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('Test database setup failed:', error);
  }
});

// Global test cleanup
afterAll(async () => {
  // Cleanup can be added here if needed
});
