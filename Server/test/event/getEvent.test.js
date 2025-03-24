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
  email: 'test.events.get@example.com',
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
    
    // Create some test events for retrieval tests
    const eventData = [
      {
        name: 'Test Gala 2025 - GET Test 1',
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
        name: 'Test Symposium 2025 - GET Test 2',
        type: 'Research Event',
        date: new Date('2025-07-20'),
        location: 'Victoria',
        capacity: 100,
        focus: 'Equipment Funding',
        criteriaMinGivingLevel: 15000,
        status: 'ListGeneration',
        createdBy: testUser.id
      },
      {
        name: 'Test Appreciation 2025 - GET Test 3',
        type: 'Cultural Event',
        date: new Date('2025-08-10'),
        location: 'Vancouver',
        capacity: 200,
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

describe('GET /api/events', () => {
  let authToken;

  beforeAll(() => {
    // Generate auth token for tests
    authToken = generateToken(testUser);
  });

  it('should get list of all events with pagination', async () => {
    const response = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('events');
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('limit');
    expect(response.body).toHaveProperty('pages');
    expect(Array.isArray(response.body.events)).toBe(true);
    expect(response.body.events.length).toBeGreaterThanOrEqual(3); // At least our 3 test events
  });

  it('should filter events by location', async () => {
    const response = await request(app)
      .get('/api/events?location=Victoria')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.events.length).toBeGreaterThanOrEqual(1);
    response.body.events.forEach(event => {
      expect(event.location).toBe('Victoria');
    });
  });

  it('should filter events by status', async () => {
    const response = await request(app)
      .get('/api/events?status=ListGeneration')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    response.body.events.forEach(event => {
      expect(event.status).toBe('ListGeneration');
    });
  });

  it('should filter events by type', async () => {
    const response = await request(app)
      .get('/api/events?type=Research Event')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    response.body.events.forEach(event => {
      expect(event.type).toBe('Research Event');
    });
  });

  it('should search events by name', async () => {
    const response = await request(app)
      .get('/api/events?search=Symposium')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.events.length).toBeGreaterThanOrEqual(1);
    expect(response.body.events.some(event => event.name.includes('Symposium'))).toBe(true);
  });

  it('should sort events by date', async () => {
    const response = await request(app)
      .get('/api/events?sort=date&order=asc')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.events.length).toBeGreaterThanOrEqual(3);
    
    // Check if dates are in ascending order
    const dates = response.body.events.map(event => new Date(event.date));
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] >= dates[i-1]).toBe(true);
    }
  });

  it('should paginate results correctly', async () => {
    const pageSize = 2;
    const page1Response = await request(app)
      .get(`/api/events?limit=${pageSize}&page=1`)
      .set('Authorization', `Bearer ${authToken}`);
    
    const page2Response = await request(app)
      .get(`/api/events?limit=${pageSize}&page=2`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(page1Response.status).toBe(200);
    expect(page2Response.status).toBe(200);
    
    expect(page1Response.body.events.length).toBeLessThanOrEqual(pageSize);
    expect(page1Response.body.page).toBe(1);
    
    if (page1Response.body.total > pageSize) {
      expect(page2Response.body.events.length).toBeGreaterThan(0);
      expect(page2Response.body.page).toBe(2);
      
      // Events on page 2 should be different from page 1
      const page1Ids = page1Response.body.events.map(e => e.id);
      const page2Ids = page2Response.body.events.map(e => e.id);
      expect(page1Ids.some(id => page2Ids.includes(id))).toBe(false);
    }
  });

  it('should require authentication', async () => {
    const response = await request(app)
      .get('/api/events');

    expect(response.status).toBe(401);
  });
});

describe('GET /api/events/:id', () => {
  let authToken;
  let testEventId;

  beforeAll(async () => {
    // Generate auth token for tests
    authToken = generateToken(testUser);
    
    // Get an event ID for testing
    const events = await prisma.event.findMany({
      where: { name: { contains: 'GET Test' } },
      take: 1
    });
    
    if (events.length > 0) {
      testEventId = events[0].id.toString();
    }
  });

  it('should get a specific event by ID', async () => {
    if (!testEventId) {
      console.log('Skipping test: No test event found');
      return;
    }

    const response = await request(app)
      .get(`/api/events/${testEventId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', testEventId);
    expect(response.body).toHaveProperty('name');
    expect(response.body).toHaveProperty('type');
    expect(response.body).toHaveProperty('date');
    expect(response.body).toHaveProperty('location');
    expect(response.body).toHaveProperty('capacity');
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('creator');
    expect(response.body.creator).toHaveProperty('id');
    expect(response.body.creator).toHaveProperty('name');
  });

  it('should handle invalid event ID format', async () => {
    const response = await request(app)
      .get('/api/events/not-a-number')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid event ID format');
  });

  it('should return 404 for non-existent event ID', async () => {
    const nonExistentId = '999999';
    const response = await request(app)
      .get(`/api/events/${nonExistentId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message', 'Event not found');
  });

  it('should require authentication', async () => {
    if (!testEventId) {
      console.log('Skipping test: No test event found');
      return;
    }

    const response = await request(app)
      .get(`/api/events/${testEventId}`);

    expect(response.status).toBe(401);
  });
});

describe('GET /api/events/status/:status', () => {
  let authToken;

  beforeAll(() => {
    // Generate auth token for tests
    authToken = generateToken(testUser);
  });

  it('should get events filtered by Planning status', async () => {
    const response = await request(app)
      .get('/api/events/status/Planning')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('events');
    expect(Array.isArray(response.body.events)).toBe(true);
    
    // All returned events should have the Planning status
    response.body.events.forEach(event => {
      expect(event.status).toBe('Planning');
    });
  });

  it('should get events filtered by ListGeneration status', async () => {
    const response = await request(app)
      .get('/api/events/status/ListGeneration')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('events');
    expect(Array.isArray(response.body.events)).toBe(true);
    
    // All returned events should have the ListGeneration status
    response.body.events.forEach(event => {
      expect(event.status).toBe('ListGeneration');
    });
  });

  it('should return validation error for invalid status', async () => {
    const response = await request(app)
      .get('/api/events/status/InvalidStatus')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid status');
    expect(response.body).toHaveProperty('validStatuses');
    expect(response.body.validStatuses).toContain('Planning');
    expect(response.body.validStatuses).toContain('ListGeneration');
    expect(response.body.validStatuses).toContain('Review');
    expect(response.body.validStatuses).toContain('Ready');
    expect(response.body.validStatuses).toContain('Complete');
  });

  it('should handle pagination for status-filtered events', async () => {
    const pageSize = 1;
    const response = await request(app)
      .get(`/api/events/status/Planning?page=1&limit=${pageSize}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.events.length).toBeLessThanOrEqual(pageSize);
    expect(response.body).toHaveProperty('page', 1);
    expect(response.body).toHaveProperty('limit', pageSize);
  });

  it('should require authentication', async () => {
    const response = await request(app)
      .get('/api/events/status/Planning');

    expect(response.status).toBe(401);
  });
});