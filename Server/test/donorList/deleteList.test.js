import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import app from '../../src/index.js';
import { startTestServer, stopTestServer } from '../helpers/testSetup.js';

const prisma = new PrismaClient();

// Set test timeout
jest.setTimeout(30000);

describe('Delete Donor List API Tests', () => {
  let testUser;
  let testEvent;
  let testList;
  let authToken;

  const testUserData = {
    name: 'Test User',
    email: 'test.delete@example.com',
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
      // Start the test server
      await startTestServer();
      
      // Clean up test data in correct order
      // First find any existing test user
      const existingUser = await prisma.user.findFirst({
        where: {
          email: testUserData.email
        }
      });

      if (existingUser) {
        // Find and delete all event donors
        const existingLists = await prisma.eventDonorList.findMany({
          where: {
            generatedBy: existingUser.id
          }
        });

        for (const list of existingLists) {
          await prisma.eventDonor.deleteMany({
            where: {
              donorListId: list.id
            }
          });
        }

        // Delete all donor lists
        await prisma.eventDonorList.deleteMany({
          where: {
            generatedBy: existingUser.id
          }
        });

        // Delete all events
        await prisma.event.deleteMany({
          where: {
            createdBy: existingUser.id
          }
        });

        // Finally delete the user
        await prisma.user.delete({
          where: {
            id: existingUser.id
          }
        });
      }

      // Create test user
      const hashedPassword = await bcrypt.hash(testUserData.password, 10);
      testUser = await prisma.user.create({
        data: {
          ...testUserData,
          password: hashedPassword
        }
      });
      console.log('Test user created:', testUser.id);

      // Create test event
      testEvent = await prisma.event.create({
        data: {
          ...testEventData,
          createdBy: testUser.id
        }
      });
      console.log('Test event created:', testEvent.id);

      // Create test list
      testList = await prisma.eventDonorList.create({
        data: {
          ...testListData,
          eventId: testEvent.id,
          generatedBy: testUser.id
        }
      });
      console.log('Test list created:', testList.id);

      // Generate auth token
      authToken = jwt.sign(
        { 
          userId: testUser.id.toString(), 
          role: testUser.role 
        },
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
      // Stop the test server
      await stopTestServer();
      
      // Clean up test data in correct order
      if (testList) {
        // First check if the list still exists
        const existingList = await prisma.eventDonorList.findUnique({
          where: { id: testList.id }
        });

        if (existingList) {
          // First delete event donors
          await prisma.eventDonor.deleteMany({
            where: {
              donorListId: testList.id
            }
          });
          // Then delete the list
          await prisma.eventDonorList.delete({
            where: { id: testList.id }
          });
        }
      }
      if (testEvent) {
        // Delete event after list is deleted
        await prisma.event.delete({
          where: { id: testEvent.id }
        });
      }
      if (testUser) {
        // Finally delete user after all dependencies are removed
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

  it('should delete donor list successfully', async () => {
    const response = await request(app)
      .delete(`/api/lists/${testList.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Donor list deleted successfully');

    // Verify list has been deleted
    const deletedList = await prisma.eventDonorList.findUnique({
      where: { id: testList.id }
    });
    expect(deletedList).toBeNull();
  });

  it('should return 404 for non-existent list', async () => {
    const response = await request(app)
      .delete('/api/lists/999999')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message', 'Donor list not found');
  });

  it('should return 401 without authentication', async () => {
    const response = await request(app)
      .delete(`/api/lists/${testList.id}`)
      .send();

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'AUTH_001');
    expect(response.body.error).toHaveProperty('message', 'Authentication token is missing');
  });
}); 