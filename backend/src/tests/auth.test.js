const request = require('supertest');
const app = require('../index');
const { initializeDatabase, query, runQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

describe('Authentication System', () => {
  let testUser;
  let accessToken;
  let refreshToken;

  beforeAll(async () => {
    // Initialize test database
    await initializeDatabase();
    
    // Create test user
    const hashedPassword = await bcrypt.hash('testpassword123', 12);
    const result = await runQuery(
      'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5)',
      ['Test User', 'test@example.com', hashedPassword, 'admin', true]
    );
    testUser = { id: result.id, email: 'test@example.com', role: 'admin' };
  });

  afterAll(async () => {
    // Cleanup test data
    await runQuery('DELETE FROM refresh_tokens WHERE user_id = $1', [testUser.id]);
    await runQuery('DELETE FROM users WHERE id = $1', [testUser.id]);
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', testUser.id);
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).toHaveProperty('role', 'admin');

      // Store tokens for other tests
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'testpassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should reject login with inactive user', async () => {
      // Create inactive user
      const hashedPassword = await bcrypt.hash('testpassword123', 12);
      const result = await runQuery(
        'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5)',
        ['Inactive User', 'inactive@example.com', hashedPassword, 'admin', false]
      );

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'testpassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Account is deactivated');

      // Cleanup
      await runQuery('DELETE FROM users WHERE id = $1', [result.id]);
    });

    it('should validate input data', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: ''
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should reject registration attempts', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
          role: 'admin'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'User registration is disabled. Please contact an administrator to create your account.');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: refreshToken
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Tokens refreshed successfully');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      // Update tokens for other tests
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Invalid refresh token');
    });

    it('should reject expired refresh token', async () => {
      // Create an expired token
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: testUser.id, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: expiredToken
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Refresh token expired');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logout successful');
    });

    it('should reject logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Access token required');
    });
  });

  describe('GET /api/auth/verify', () => {
    it('should verify valid token', async () => {
      // Login again to get new tokens
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });

      const newAccessToken = loginResponse.body.accessToken;

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${newAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Token is valid');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', testUser.id);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Invalid access token');
    });

    it('should reject expired token', async () => {
      // Create an expired token
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: testUser.id, role: 'admin', type: 'access' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Access token expired');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile', async () => {
      // Login again to get new tokens
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });

      const newAccessToken = loginResponse.body.accessToken;

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${newAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', testUser.id);
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).toHaveProperty('role', 'admin');
      expect(response.body.user).not.toHaveProperty('password');
    });
  });
});
