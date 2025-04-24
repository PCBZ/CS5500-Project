import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import app from '../../src/index.js';

const prisma = new PrismaClient();

// Increase timeout for database operations
jest.setTimeout(30000);

describe('Get User Details', () => {
  const testUser = {
    name: 'Test Get User',
    email: 'test.getUser@example.com',
    password: 'password123',
    role: 'pmm'
  };

  let authToken;
  let userId;

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

      userId = user.id;

      // Get auth token by logging in
      const loginResponse = await request(app)
        .post('/api/user/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      authToken = loginResponse.body.token;
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

  it('should get user details successfully with valid token', async () => {
    const response = await request(app)
      .get(`/api/user/${userId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', userId);
    expect(response.body).toHaveProperty('name', testUser.name);
    expect(response.body).toHaveProperty('email', testUser.email);
    expect(response.body).toHaveProperty('role', testUser.role);
    expect(response.body).not.toHaveProperty('password');
  }, 10000);

  it('should not get user details without token', async () => {
    const response = await request(app)
      .get(`/api/user/${userId}`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', 'AUTH_001');
    expect(response.body.error).toHaveProperty('message', 'Authentication token is missing');
  }, 10000);

  it('should not get user details with invalid token', async () => {
    const response = await request(app)
      .get(`/api/user/${userId}`)
      .set('Authorization', 'Bearer invalid_token');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', 'AUTH_003');
    expect(response.body.error).toHaveProperty('message', 'Invalid token');
  }, 10000);

  it('should not get non-existent user', async () => {
    const response = await request(app)
      .get('/api/user/999999')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message', 'User not found');
  }, 10000);

  it('should return 400 for invalid user ID format', async () => {
    const response = await request(app)
      .get('/api/user/invalid-id')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid user ID format');
  }, 10000);

  it('should not get user details with expired token', async () => {
    // Create an expired token
    const expiredToken = jwt.sign(
      { userId: userId, role: testUser.role },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '0s' }
    );

    const response = await request(app)
      .get(`/api/user/${userId}`)
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', 'AUTH_003');
    expect(response.body.error).toHaveProperty('message', 'Invalid token');
  }, 10000);
}); 