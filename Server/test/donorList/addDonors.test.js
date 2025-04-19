import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import app from '../../src/index.js';
import { startTestServer, stopTestServer } from '../helpers/testSetup.js';

const prisma = new PrismaClient();

// Set test timeout
jest.setTimeout(30000);

describe('Add Donors to List API Tests', () => {
  let testUser;
  let testEvent;
  let testList;
  let testDonor;
  let authToken;

  const testUserData = {
    name: 'Test User',
    email: 'test.add@example.com',
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

  const testDonorData = {
    firstName: 'John',
    lastName: 'Doe',
    totalDonations: 5000,
    largestGift: 2000
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

      // Create test donor
      testDonor = await prisma.donor.create({
        data: testDonorData
      });
      console.log('Test donor created:', testDonor.id);

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
      if (testEvent) {
        // Delete event after list is deleted
        await prisma.event.delete({
          where: { id: testEvent.id }
        });
      }
      if (testDonor) {
        // Delete donor after event donors are deleted
        await prisma.donor.delete({
          where: { id: testDonor.id }
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

  it('should add donor to list successfully', async () => {
    const response = await request(app)
      .post(`/api/lists/${testList.id}/donors`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        donors: [{
          donor_id: testDonor.id.toString(),
          status: 'Pending',
          comments: 'Test donor'
        }]
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Donors added successfully.');
    expect(response.body).toHaveProperty('added_donors');
    expect(response.body.added_donors).toBeInstanceOf(Array);
    expect(response.body.added_donors.length).toBe(1);

    // Verify list statistics have been updated
    const updatedList = await prisma.eventDonorList.findUnique({
      where: { id: testList.id }
    });
    expect(updatedList.totalDonors).toBe(1);
    expect(updatedList.pending).toBe(1);
  });

  it('should return 404 for non-existent list', async () => {
    const response = await request(app)
      .post('/api/lists/999999/donors')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        donors: [{
          donor_id: testDonor.id.toString(),
          status: 'Pending',
          comments: 'Test donor'
        }]
      });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message', 'List not found');
  });

  it('should return 401 without authentication', async () => {
    const response = await request(app)
      .post(`/api/lists/${testList.id}/donors`)
      .send({
        donors: [{
          donor_id: testDonor.id.toString(),
          status: 'Pending',
          comments: 'Test donor'
        }]
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message', 'Not authorized, no token');
  });

  it('should handle multiple donors in a single request', async () => {
    // Create second test donor
    const secondDonor = await prisma.donor.create({
      data: {
        firstName: 'Jane',
        lastName: 'Smith',
        totalDonations: 3000,
        largestGift: 1500
      }
    });

    const response = await request(app)
      .post(`/api/lists/${testList.id}/donors`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        donors: [
          {
            donor_id: testDonor.id.toString(),
            status: 'Pending',
            comments: 'First donor'
          },
          {
            donor_id: secondDonor.id.toString(),
            status: 'Pending',
            comments: 'Second donor'
          }
        ]
      });

    expect(response.status).toBe(201);
    expect(response.body.added_donors).toHaveLength(2);

    // Clean up second test donor
    // First delete the event donor record
    await prisma.eventDonor.deleteMany({
      where: {
        donorId: secondDonor.id
      }
    });
    // Then delete the donor
    await prisma.donor.delete({
      where: { id: secondDonor.id }
    });
  });
}); 