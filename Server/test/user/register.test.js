import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import app from '../../src/index.js';

const prisma = new PrismaClient();

// Increase timeout for database operations
jest.setTimeout(30000);

// Clean up the test database before and after tests
beforeAll(async () => {
  try {
    await prisma.$connect();
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test_user'
        }
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}, 30000);

afterAll(async () => {
  try {
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test_user'
        }
      }
    });
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}, 30000);

describe('User Registration', () => {
  const validUser = {
    name: 'Test User',
    email: 'test_user@example.com',
    password: 'password123',
    role: 'pmm'
  };

  it('should register a new user successfully', async () => {
    const response = await request(app)
      .post('/api/user/register')
      .send(validUser);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'User registered successfully.');
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user).toHaveProperty('name', validUser.name);
    expect(response.body.user).toHaveProperty('email', validUser.email);
    expect(response.body.user).toHaveProperty('role', validUser.role);
    expect(response.body.user).not.toHaveProperty('password');

    // Verify the user was actually created in the database
    const createdUser = await prisma.user.findUnique({
      where: { email: validUser.email }
    });
    expect(createdUser).toBeTruthy();
    expect(createdUser.name).toBe(validUser.name);
    
    // Verify password was hashed
    const validPassword = await bcrypt.compare(validUser.password, createdUser.password);
    expect(validPassword).toBe(true);
  }, 10000);

  it('should not register a user with an existing email', async () => {
    // First registration
    await request(app)
      .post('/api/user/register')
      .send(validUser);

    // Attempt to register with the same email
    const response = await request(app)
      .post('/api/user/register')
      .send(validUser);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'User already exists');
  }, 10000);

  it('should not register a user with invalid role', async () => {
    const invalidUser = {
      ...validUser,
      email: 'test_user2@example.com',
      role: 'invalid_role'
    };

    const response = await request(app)
      .post('/api/user/register')
      .send(invalidUser);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid role');
  }, 10000);

  it('should not register a user without required fields', async () => {
    const invalidUsers = [
      { ...validUser, name: undefined },
      { ...validUser, email: undefined },
      { ...validUser, password: undefined },
      { ...validUser, role: undefined }
    ];

    for (const invalidUser of invalidUsers) {
      const response = await request(app)
        .post('/api/user/register')
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'All fields are required');
    }
  }, 10000);
}); 