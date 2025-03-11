import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import app from '../../src/index.js';

const prisma = new PrismaClient();

// Increase timeout for database operations
jest.setTimeout(30000);

describe('User Login', () => {
  const testUser = {
    name: 'Test Login User',
    email: 'test_login@example.com',
    password: 'password123',
    role: 'pmm'
  };

  // Create a test user before all tests
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
      await prisma.user.create({
        data: {
          name: testUser.name,
          email: testUser.email,
          password: hashedPassword,
          role: testUser.role
        }
      });
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

  it('should login successfully with valid credentials', async () => {
    const response = await request(app)
      .post('/api/user/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Login successful');
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user).toHaveProperty('name', testUser.name);
    expect(response.body.user).toHaveProperty('email', testUser.email);
    expect(response.body.user).toHaveProperty('role', testUser.role);
    expect(response.body.user).not.toHaveProperty('password');

    // Verify JWT token
    const decodedToken = jwt.verify(
      response.body.token,
      process.env.JWT_SECRET || 'your_jwt_secret_key'
    );
    expect(decodedToken).toHaveProperty('userId');
    expect(decodedToken).toHaveProperty('role', testUser.role);
  }, 10000);

  it('should not login with incorrect password', async () => {
    const response = await request(app)
      .post('/api/user/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid credentials');
    expect(response.body).not.toHaveProperty('token');
    expect(response.body).not.toHaveProperty('user');
  }, 10000);

  it('should not login with non-existent email', async () => {
    const response = await request(app)
      .post('/api/user/login')
      .send({
        email: 'nonexistent@example.com',
        password: testUser.password
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid credentials');
    expect(response.body).not.toHaveProperty('token');
    expect(response.body).not.toHaveProperty('user');
  }, 10000);

  it('should not login with missing credentials', async () => {
    const testCases = [
      { email: testUser.email },
      { password: testUser.password },
      {}
    ];

    for (const testCase of testCases) {
      const response = await request(app)
        .post('/api/user/login')
        .send(testCase);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Email and password are required');
    }
  }, 10000);
}); 