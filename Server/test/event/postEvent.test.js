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
  email: 'test.events.post@example.com',
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

describe('POST /api/events', () => {
  let authToken;

  beforeAll(() => {
    // Generate auth token for tests
    authToken = generateToken(testUser);
  });

  it('should create a new event successfully', async () => {
    const newEvent = {
      name: 'Test Gala 2025 - POST Test',
      type: 'Major Donor Event',
      date: '2025-06-15T18:00:00.000Z',
      location: 'Vancouver',
      capacity: 150,
      focus: 'Cancer Research',
      criteriaMinGivingLevel: 20000,
      timelineListGenerationDate: '2025-04-15T00:00:00.000Z',
      timelineReviewDeadline: '2025-05-01T00:00:00.000Z',
      timelineInvitationDate: '2025-05-15T00:00:00.000Z'
    };

    const response = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newEvent);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Event created successfully');
    expect(response.body).toHaveProperty('event');
    expect(response.body.event).toHaveProperty('id');
    expect(response.body.event).toHaveProperty('name', newEvent.name);
    expect(response.body.event).toHaveProperty('type', newEvent.type);
    expect(response.body.event).toHaveProperty('location', newEvent.location);
    expect(response.body.event).toHaveProperty('capacity', newEvent.capacity);
    expect(response.body.event).toHaveProperty('criteriaMinGivingLevel', newEvent.criteriaMinGivingLevel);
    expect(response.body.event).toHaveProperty('status', 'Planning'); // Default status
    expect(response.body.event).toHaveProperty('createdBy', testUser.id.toString());
    expect(response.body.event).toHaveProperty('creator');
    expect(response.body.event.creator).toHaveProperty('name', testUser.name);
    
    // Verify the event was actually created in the database
    const eventId = response.body.event.id;
    const createdEvent = await prisma.event.findUnique({
      where: { id: parseInt(eventId) }
    });
    
    expect(createdEvent).toBeTruthy();
    expect(createdEvent.name).toBe(newEvent.name);
  });

  it('should create an event with minimal required fields', async () => {
    const minimalEvent = {
      name: 'Test Minimal Event - POST Test',
      type: 'Research Event',
      date: '2025-07-20T18:00:00.000Z',
      location: 'Victoria'
    };

    const response = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${authToken}`)
      .send(minimalEvent);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Event created successfully');
    expect(response.body.event).toHaveProperty('name', minimalEvent.name);
    expect(response.body.event).toHaveProperty('type', minimalEvent.type);
    expect(response.body.event).toHaveProperty('date');
    expect(response.body.event).toHaveProperty('location', minimalEvent.location);
    expect(response.body.event).toHaveProperty('capacity', 0); // Default value
    expect(response.body.event).toHaveProperty('criteriaMinGivingLevel', 0); // Default value
  });

  it('should create an event with a specific status', async () => {
    const eventWithStatus = {
      name: 'Test Status Event - POST Test',
      type: 'Cultural Event',
      date: '2025-08-10T18:00:00.000Z',
      location: 'Vancouver',
      status: 'ListGeneration'
    };

    const response = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${authToken}`)
      .send(eventWithStatus);

    expect(response.status).toBe(201);
    expect(response.body.event).toHaveProperty('status', eventWithStatus.status);
  });

  it('should require name, type, date, and location', async () => {
    // Test missing name
    const missingName = {
      type: 'Major Donor Event',
      date: '2025-06-15T18:00:00.000Z',
      location: 'Vancouver'
    };
    
    const responseNoName = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${authToken}`)
      .send(missingName);
    
    expect(responseNoName.status).toBe(400);
    expect(responseNoName.body).toHaveProperty('message', 'Name, type, date, and location are required');
    
    // Test missing type
    const missingType = {
      name: 'Test Missing Type',
      date: '2025-06-15T18:00:00.000Z',
      location: 'Vancouver'
    };
    
    const responseNoType = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${authToken}`)
      .send(missingType);
    
    expect(responseNoType.status).toBe(400);
    
    // Test missing date
    const missingDate = {
      name: 'Test Missing Date',
      type: 'Major Donor Event',
      location: 'Vancouver'
    };
    
    const responseNoDate = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${authToken}`)
      .send(missingDate);
    
    expect(responseNoDate.status).toBe(400);
    
    // Test missing location
    const missingLocation = {
      name: 'Test Missing Location',
      type: 'Major Donor Event',
      date: '2025-06-15T18:00:00.000Z'
    };
    
    const responseNoLocation = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${authToken}`)
      .send(missingLocation);
    
    expect(responseNoLocation.status).toBe(400);
  });

  it('should handle date fields correctly', async () => {
    const eventWithDates = {
      name: 'Test Dates Event - POST Test',
      type: 'Major Donor Event',
      date: '2025-06-15T18:00:00.000Z',
      location: 'Vancouver',
      timelineListGenerationDate: '2025-04-15T00:00:00.000Z',
      timelineReviewDeadline: '2025-05-01T00:00:00.000Z',
      timelineInvitationDate: '2025-05-15T00:00:00.000Z'
    };

    const response = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${authToken}`)
      .send(eventWithDates);

    expect(response.status).toBe(201);
    expect(response.body.event).toHaveProperty('date');
    expect(response.body.event).toHaveProperty('timelineListGenerationDate');
    expect(response.body.event).toHaveProperty('timelineReviewDeadline');
    expect(response.body.event).toHaveProperty('timelineInvitationDate');
    
    // Verify dates are ISO strings (indicating they were properly stored and formatted)
    expect(typeof response.body.event.date).toBe('string');
    expect(Date.parse(response.body.event.date)).not.toBeNaN();
    expect(Date.parse(response.body.event.timelineListGenerationDate)).not.toBeNaN();
    expect(Date.parse(response.body.event.timelineReviewDeadline)).not.toBeNaN();
    expect(Date.parse(response.body.event.timelineInvitationDate)).not.toBeNaN();
  });

  it('should require authentication', async () => {
    const newEvent = {
      name: 'Test Auth Event',
      type: 'Major Donor Event',
      date: '2025-06-15T18:00:00.000Z',
      location: 'Vancouver'
    };

    const response = await request(app)
      .post('/api/events')
      .send(newEvent);

    expect(response.status).toBe(401);
  });
});