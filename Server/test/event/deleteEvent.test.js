import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/index.js';
import jwt from 'jsonwebtoken';
import { setupTestUser, cleanupTestEvents } from '../helpers/testSetup.js';

const prisma = new PrismaClient();

// Increase timeout for database operations
jest.setTimeout(30000);

// Test user data
let testUser = {
  name: 'Test User',
  email: 'test.events.delete@example.com',
  role: 'pmm'
};

// Generate a valid token for auth
const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET || 'your_jwt_secret_key',
    { expiresIn: '1h' }
  );
};

// Clean up the test database before and after tests
beforeAll(async () => {
  try {
    await prisma.$connect();
    testUser = await setupTestUser(prisma, testUser);
    await cleanupTestEvents(prisma);
  } catch (error) {
    console.error('Database setup error:', error);
    throw error;
  }
}, 30000);

afterAll(async () => {
  try {
    await cleanupTestEvents(prisma);
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}, 30000);

describe('DELETE /api/events/:id', () => {
  let authToken;
  let testEventId;

  beforeEach(async () => {
    // Generate auth token for tests
    authToken = generateToken(testUser);
    
    // Create a fresh test event for each test
    const eventData = {
      name: `Test Delete Event - ${Date.now()}`,
      type: 'Major Donor Event',
      date: new Date('2025-06-15'),
      location: 'Vancouver',
      capacity: 150,
      status: 'Planning',
      createdBy: testUser.id
    };
    
    const createdEvent = await prisma.event.create({ data: eventData });
    testEventId = createdEvent.id.toString();
  });

  it('should delete an existing event', async () => {
    const response = await request(app)
      .delete(`/api/events/${testEventId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Event deleted successfully');
    
    // Verify the event was soft deleted (isDeleted flag set to true)
    const deletedEvent = await prisma.event.findUnique({
      where: { id: parseInt(testEventId) }
    });
    
    expect(deletedEvent).not.toBeNull();
    expect(deletedEvent.isDeleted).toBe(true);
  });

  it('should handle invalid event ID format', async () => {
    const response = await request(app)
      .delete('/api/events/not-a-number')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid event ID format');
  });

  it('should allow deleting an already deleted event', async () => {
    // First delete the test event
    await request(app)
      .delete(`/api/events/${testEventId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    // Then try to delete it again
    const response = await request(app)
      .delete(`/api/events/${testEventId}`)
      .set('Authorization', `Bearer ${authToken}`);

    // Should still return success 
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Event deleted successfully');
  });

  it('should require authentication', async () => {
    const response = await request(app)
      .delete(`/api/events/${testEventId}`);

    expect(response.status).toBe(401);
  });
});