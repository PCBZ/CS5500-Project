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
  email: 'test.events.put@example.com',
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
    
    // Create test events for updating
    const eventData = [
      {
        name: 'Test Gala 2025 - PUT Test',
        type: 'Major Donor Event',
        date: new Date('2025-06-15'),
        location: 'Vancouver',
        capacity: 150,
        focus: 'Cancer Research',
        criteriaMinGivingLevel: 20000,
        status: 'Planning',
        createdBy: testUser.id
      },
      {
        name: 'Test Status Event - PUT Test',
        type: 'Cultural Event',
        date: new Date('2025-08-10'),
        location: 'Victoria',
        capacity: 100,
        focus: 'Patient Care',
        criteriaMinGivingLevel: 10000,
        status: 'Planning',
        createdBy: testUser.id
      }
    ];
    
    for (const event of eventData) {
      await prisma.event.create({ data: event });
    }
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

describe('PUT /api/events/:id', () => {
  let authToken;
  let testEventId;

  beforeAll(async () => {
    // Generate auth token for tests
    authToken = generateToken(testUser);
    
    // Get an event ID for testing
    const events = await prisma.event.findMany({
      where: { name: 'Test Gala 2025 - PUT Test' },
      take: 1
    });
    
    if (events.length > 0) {
      testEventId = events[0].id.toString();
    } else {
      console.error('No test event found for PUT tests');
    }
  });

  it('should update an existing event', async () => {
    if (!testEventId) {
      console.log('Skipping test: No test event found');
      return;
    }

    const updateData = {
      name: 'Test Gala 2025 - Updated',
      capacity: 200,
      focus: 'Updated Focus Area'
    };

    const response = await request(app)
      .put(`/api/events/${testEventId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Event updated successfully');
    expect(response.body.event).toHaveProperty('name', updateData.name);
    expect(response.body.event).toHaveProperty('capacity', updateData.capacity);
    expect(response.body.event).toHaveProperty('focus', updateData.focus);
    
    // Verify the event was actually updated in the database
    const updatedEvent = await prisma.event.findUnique({
      where: { id: parseInt(testEventId) }
    });
    
    expect(updatedEvent).toBeTruthy();
    expect(updatedEvent.name).toBe(updateData.name);
    expect(updatedEvent.capacity).toBe(updateData.capacity);
    expect(updatedEvent.focus).toBe(updateData.focus);
  });

  it('should update date fields correctly', async () => {
    if (!testEventId) {
      console.log('Skipping test: No test event found');
      return;
    }

    const updateData = {
      date: '2025-07-20T18:00:00.000Z',
      timelineListGenerationDate: '2025-05-15T00:00:00.000Z',
      timelineReviewDeadline: '2025-06-01T00:00:00.000Z',
      timelineInvitationDate: '2025-06-15T00:00:00.000Z'
    };

    const response = await request(app)
      .put(`/api/events/${testEventId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.event).toHaveProperty('date');
    expect(response.body.event).toHaveProperty('timelineListGenerationDate');
    expect(response.body.event).toHaveProperty('timelineReviewDeadline');
    expect(response.body.event).toHaveProperty('timelineInvitationDate');
    
    // Verify dates match the update
    const eventDate = new Date(response.body.event.date);
    const formattedEventDate = eventDate.toISOString();
    expect(formattedEventDate).toContain('2025-07-20');
    
    const listGenDate = new Date(response.body.event.timelineListGenerationDate);
    const formattedListGenDate = listGenDate.toISOString();
    expect(formattedListGenDate).toContain('2025-05-15');
  });

  it('should update numeric fields correctly', async () => {
    if (!testEventId) {
      console.log('Skipping test: No test event found');
      return;
    }

    const updateData = {
      capacity: 250,
      criteriaMinGivingLevel: 30000
    };

    const response = await request(app)
      .put(`/api/events/${testEventId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.event).toHaveProperty('capacity', updateData.capacity);
    expect(response.body.event).toHaveProperty('criteriaMinGivingLevel', updateData.criteriaMinGivingLevel);
  });

  it('should handle invalid event ID format', async () => {
    const response = await request(app)
      .put('/api/events/not-a-number')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Updated Name' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid event ID format');
  });

  it('should return 404 for non-existent event ID', async () => {
    const nonExistentId = '999999';
    const response = await request(app)
      .put(`/api/events/${nonExistentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Updated Name' });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message', 'Event not found');
  });

  it('should require authentication', async () => {
    if (!testEventId) {
      console.log('Skipping test: No test event found');
      return;
    }

    const response = await request(app)
      .put(`/api/events/${testEventId}`)
      .send({ name: 'Updated Name' });

    expect(response.status).toBe(401);
  });
});