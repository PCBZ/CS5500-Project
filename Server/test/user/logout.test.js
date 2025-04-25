import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import app from '../../src/index.js';

const prisma = new PrismaClient();

// Increase timeout for database operations
jest.setTimeout(30000);

describe('User Logout', () => {
  const testUser = {
    name: 'Test Logout User',
    email: 'test.logout@example.com',
    password: 'password123',
    role: 'pmm'
  };

  let authToken;

  // Create a test user and get auth token before all tests
  beforeAll(async () => {
    try {
      await prisma.$connect();
      // Clean up any existing test user
      await prisma.user.deleteMany({
        where: {
          email: testUser.email
        }
      });

      // Create a new test user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(testUser.password, salt);
      const user = await prisma.user.create({
        data: {
          name: testUser.name,
          email: testUser.email,
          password: hashedPassword,
          role: testUser.role
        }
      });

      console.log('Test user created:', user.id);

      // Get auth token by logging in
      const loginResponse = await request(app)
        .post('/api/user/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      console.log('Login response status:', loginResponse.status);
      console.log('Login response body:', loginResponse.body);

      authToken = loginResponse.body.token;
      console.log('Auth token:', authToken);

      if (authToken) {
        // Decode token to check payload
        const decoded = jwt.decode(authToken);
        console.log('Decoded token:', decoded);
      } else {
        console.log('No auth token received from login');
      }
    } catch (error) {
      console.error('Setup error:', error);
      throw error;
    }
  }, 30000);

  // Clean up after all tests
  afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: {
          email: testUser.email
        }
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    } finally {
      await prisma.$disconnect();
    }
  }, 30000);

  it('should logout successfully with valid token', async () => {
    const response = await request(app)
      .post('/api/user/logout')
      .set('Authorization', `Bearer ${authToken}`);

    console.log('Logout response status:', response.status);
    console.log('Logout response body:', response.body);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Logout successful.');
  }, 10000);

  it('should not logout without token', async () => {
    const response = await request(app)
      .post('/api/user/logout');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', 'AUTH_001');
    expect(response.body.error).toHaveProperty('message', 'Authentication token is missing');
  }, 10000);

  it('should not logout with invalid token', async () => {
    const response = await request(app)
      .post('/api/user/logout')
      .set('Authorization', 'Bearer invalid_token');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', 'AUTH_003');
    expect(response.body.error).toHaveProperty('message', 'Invalid token');
  }, 10000);

  it('should not logout with malformed token', async () => {
    const response = await request(app)
      .post('/api/user/logout')
      .set('Authorization', 'InvalidTokenFormat');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', 'AUTH_001');
    expect(response.body.error).toHaveProperty('message', 'Authentication token is missing');
  }, 10000);

  it('should not logout with expired token', async () => {
    // Create an expired token
    const expiredToken = jwt.sign(
      { userId: '1', role: 'pmm' },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '0s' } // Token expires immediately
    );

    const response = await request(app)
      .post('/api/user/logout')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', 'AUTH_003');
    expect(response.body.error).toHaveProperty('message', 'Invalid token');
  }, 10000);
}); 