import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import app from '../../src/index.js';

const prisma = new PrismaClient();

// set test timeout
jest.setTimeout(30000);

describe('Get All Donor Lists API Tests', () => {
  let testUser;
  let testEvent;
  let testList;
  let authToken;

  const testUserData = {
    name: 'Test User',
    email: 'test_get_lists@example.com',
    password: 'password123',
    role: 'pmm'
  };

  const testEventData = {
    name: 'Test Event',
    type: 'Fundraiser',
    date: new Date(),
    location: 'Test Location',
    capacity: 100,
    focus: 'Test Focus',
    criteriaMinGivingLevel: 1000
  };

  const testListData = {
    name: 'Test Donor List',
    totalDonors: 0,
    approved: 0,
    excluded: 0,
    pending: 0,
    autoExcluded: 0,
    reviewStatus: 'pending'
  };

  beforeAll(async () => {
    try {
      // create test user
      const hashedPassword = await bcrypt.hash(testUserData.password, 10);
      testUser = await prisma.user.create({
        data: {
          ...testUserData,
          email: testUserData.email,
          password: hashedPassword
        }
      });
      console.log('Test user created:', testUser.id);

      // create test event
      testEvent = await prisma.event.create({
        data: {
          ...testEventData,
          createdBy: testUser.id
        }
      });
      console.log('Test event created:', testEvent.id);

      // create test event donor list
      testList = await prisma.eventDonorList.create({
        data: {
          ...testListData,
          eventId: testEvent.id,
          generatedBy: testUser.id
        }
      });
      console.log('Test list created:', testList.id);

      // create test auth token
      authToken = jwt.sign(
        { userId: testUser.id.toString(), role: testUser.role },
        process.env.JWT_SECRET || 'your_jwt_secret_key',
        { expiresIn: '1h' }
      );
      console.log('Auth token generated');
    } catch (error) {
      console.error('Error in beforeAll:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      // clean up test data
      if (testList) {
        await prisma.eventDonorList.delete({
          where: { id: testList.id }
        });
      }
      if (testEvent) {
        await prisma.event.delete({
          where: { id: testEvent.id }
        });
      }
      if (testUser) {
        await prisma.user.delete({
          where: { id: testUser.id }
        });
      }
      await prisma.$disconnect();
    } catch (error) {
      console.error('Error in afterAll:', error);
      throw error;
    }
  });

  it('should get all donor lists with pagination', async () => {
    const response = await request(app)
      .get('/api/lists')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_count');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('limit');
    expect(response.body).toHaveProperty('lists');
    expect(Array.isArray(response.body.lists)).toBe(true);
  });

  it('should filter lists by status', async () => {
    const response = await request(app)
      .get('/api/lists?status=pending')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.lists.every(list => list.review_status === 'pending')).toBe(true);
  });

  it('should handle custom page size', async () => {
    const response = await request(app)
      .get('/api/lists?limit=5')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.limit).toBe(5);
  });

  it('should handle custom page number', async () => {
    const response = await request(app)
      .get('/api/lists?page=2')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.page).toBe(2);
  });

  it('should return 401 without authentication', async () => {
    const response = await request(app)
      .get('/api/lists');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message', 'Not authorized, no token');
  });
}); 