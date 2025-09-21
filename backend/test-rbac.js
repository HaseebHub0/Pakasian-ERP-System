const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test users
const testUsers = {
  admin: { email: 'admin1@pakasian.com', password: 'password123' },
  director: { email: 'director1@pakasian.com', password: 'password123' },
  accountant: { email: 'accountant1@pakasian.com', password: 'password123' },
  gatekeeper: { email: 'gatekeeper1@pakasian.com', password: 'password123' }
};

// Helper function to make authenticated requests
async function makeRequest(method, url, token, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
}

// Test login for each role
async function testLogin(role, credentials) {
  console.log(`\n🔐 Testing login for ${role.toUpperCase()}:`);
  console.log(`Email: ${credentials.email}`);
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, credentials);
    console.log(`✅ Login successful - Status: ${response.status}`);
    console.log(`User: ${response.data.user.name} (${response.data.user.role})`);
    return response.data.accessToken;
  } catch (error) {
    console.log(`❌ Login failed - Status: ${error.response?.status}`);
    console.log(`Error: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// Test role-based access
async function testRoleAccess(role, token) {
  console.log(`\n🔍 Testing role-based access for ${role.toUpperCase()}:`);
  
  const tests = [
    // Admin tests
    { url: '/api/users', method: 'GET', expected: role === 'admin' ? 200 : 403, description: 'Get users list' },
    { url: '/api/admin/users', method: 'GET', expected: role === 'admin' ? 200 : 404, description: 'Admin users page' },
    
    // Director tests
    { url: '/api/dashboard', method: 'GET', expected: role === 'director' ? 200 : 403, description: 'Dashboard access' },
    { url: '/api/dashboard/financial', method: 'GET', expected: role === 'director' ? 200 : 403, description: 'Financial reports' },
    
    // Accountant tests
    { url: '/api/sales', method: 'GET', expected: ['accountant', 'admin'].includes(role) ? 200 : 403, description: 'Sales access' },
    { url: '/api/sales', method: 'POST', expected: ['accountant', 'admin'].includes(role) ? 400 : 403, description: 'Create sale (will fail validation but should allow access)' },
    
    // Gatekeeper tests
    { url: '/api/stock-movements', method: 'GET', expected: ['gatekeeper', 'admin'].includes(role) ? 200 : 403, description: 'Stock movements access' },
    { url: '/api/stock-movements/stock-in', method: 'POST', expected: ['gatekeeper', 'admin'].includes(role) ? 400 : 403, description: 'Stock in (will fail validation but should allow access)' },
    
    // Shared access tests
    { url: '/api/products', method: 'GET', expected: 200, description: 'Products access (all roles)' },
    { url: '/api/warehouses', method: 'GET', expected: 200, description: 'Warehouses access (all roles)' }
  ];
  
  for (const test of tests) {
    const result = await makeRequest(test.method, test.url, token);
    const expectedStatus = Array.isArray(test.expected) ? test.expected : [test.expected];
    const status = result.status || 0;
    
    if (expectedStatus.includes(status)) {
      console.log(`✅ ${test.description}: ${status} (expected)`);
    } else {
      console.log(`❌ ${test.description}: ${status} (expected ${expectedStatus.join(' or ')})`);
      if (result.error) {
        console.log(`   Error: ${JSON.stringify(result.error)}`);
      }
    }
  }
}

// Test forbidden access
async function testForbiddenAccess(role, token) {
  console.log(`\n🚫 Testing forbidden access for ${role.toUpperCase()}:`);
  
  const forbiddenTests = [
    // Gatekeeper trying to access admin functions
    { url: '/api/users', method: 'POST', description: 'Create user (forbidden for gatekeeper)' },
    { url: '/api/admin/users', method: 'GET', description: 'Admin users page (forbidden for gatekeeper)' },
    
    // Director trying to create data
    { url: '/api/sales', method: 'POST', description: 'Create sale (forbidden for director)' },
    { url: '/api/stock-movements', method: 'POST', description: 'Create stock movement (forbidden for director)' },
    
    // Accountant trying to access admin functions
    { url: '/api/users', method: 'POST', description: 'Create user (forbidden for accountant)' },
    { url: '/api/admin/products', method: 'POST', description: 'Create product (forbidden for accountant)' }
  ];
  
  for (const test of forbiddenTests) {
    const result = await makeRequest(test.method, test.url, token);
    
    if (result.status === 403) {
      console.log(`✅ ${test.description}: 403 Forbidden (correctly blocked)`);
    } else if (result.status === 404) {
      console.log(`✅ ${test.description}: 404 Not Found (route not accessible)`);
    } else {
      console.log(`❌ ${test.description}: ${result.status} (should be 403 or 404)`);
    }
  }
}

// Main test function
async function runRBACTests() {
  console.log('🚀 Starting RBAC (Role-Based Access Control) Tests');
  console.log('=' .repeat(60));
  
  for (const [role, credentials] of Object.entries(testUsers)) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing ${role.toUpperCase()} Role`);
    console.log('='.repeat(60));
    
    // Test login
    const token = await testLogin(role, credentials);
    
    if (token) {
      // Test allowed access
      await testRoleAccess(role, token);
      
      // Test forbidden access
      await testForbiddenAccess(role, token);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ RBAC Tests Completed');
  console.log('='.repeat(60));
}

// Run tests
runRBACTests().catch(console.error);
