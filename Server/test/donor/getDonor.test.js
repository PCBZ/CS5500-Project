import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import app from '../../src/index.js';

const prisma = new PrismaClient();

// Increase timeout for database operations
jest.setTimeout(30000);

// Test user data for authentication
const testUser = {
  id: 1,
  name: 'Test User',
  email: 'test.user@example.com',
  role: 'pmm'
};

// Generate a valid token for testing
const generateToken = () => {
  return jwt.sign(
    { userId: testUser.id, role: testUser.role },
    process.env.JWT_SECRET || 'your_jwt_secret_key',
    { expiresIn: '1h' }
  );
};

// Test donor data
const testDonor = {
  firstName: 'Lee',
  lastName: 'Doe',
  pmm: 'Test PMM',
  totalDonations: 5000,
  city: 'Vancouver'
};

// Clean up the test database before and after tests
beforeAll(async () => {
  try {
    await prisma.$connect();
    // Clean up specific test data
    await prisma.donor.deleteMany({
      where: {
        firstName: testDonor.firstName,
        lastName: testDonor.lastName,
        pmm: testDonor.pmm
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}, 30000);

afterAll(async () => {
  try {
    // Clean up specific test data
    await prisma.donor.deleteMany({
      where: {
        firstName: testDonor.firstName,
        lastName: testDonor.lastName,
        pmm: testDonor.pmm
      }
    });
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}, 30000);

describe('Get Donor API', () => {
  let donorId;
  const token = generateToken();

  // Create a test donor first
  beforeAll(async () => {
    try {
      const donor = await prisma.donor.create({
        data: testDonor
      });
      donorId = donor.id;
    } catch (error) {
      console.error('Error creating test donor:', error);
      throw error;
    }
  }, 30000);

  describe('GET /api/donors/:id', () => {
    it('should get a donor by ID', async () => {
      const response = await request(app)
        .get(`/api/donors/${donorId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', donorId.toString());
      expect(response.body).toHaveProperty('firstName', testDonor.firstName);
      expect(response.body).toHaveProperty('lastName', testDonor.lastName);
      expect(response.body).toHaveProperty('pmm', testDonor.pmm);
      expect(response.body).toHaveProperty('totalDonations', testDonor.totalDonations);
    }, 10000);

    it('should return 404 for non-existent donor ID', async () => {
      const nonExistentId = 9999999; // Assuming this ID doesn't exist
      const response = await request(app)
        .get(`/api/donors/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Donor not found');
    }, 10000);

    it('should return 400 for invalid donor ID format', async () => {
      const response = await request(app)
        .get('/api/donors/invalid-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid donor ID format');
    }, 10000);

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/donors/${donorId}`);

      expect(response.status).toBe(401);
    }, 10000);
  });

  describe('GET /api/donors', () => {
    it('should get a list of donors with pagination', async () => {
      const response = await request(app)
        .get('/api/donors?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('donors');
      expect(Array.isArray(response.body.donors)).toBe(true);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 10);
      expect(response.body).toHaveProperty('pages');
    }, 10000);

    it('should filter donors by city', async () => {
      const response = await request(app)
        .get(`/api/donors?city=${testDonor.city}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('donors');
      
      // All returned donors should have the specified city
      response.body.donors.forEach(donor => {
        expect(donor.city).toBe(testDonor.city);
      });

      // Our test donor should be in the results
      const foundDonor = response.body.donors.find(donor => donor.id === donorId.toString());
      expect(foundDonor).toBeTruthy();
    }, 10000);

    it('should filter donors by pmm', async () => {
      const response = await request(app)
        .get(`/api/donors?pmm=${encodeURIComponent(testDonor.pmm)}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('donors');
      
      // All returned donors should have the specified PMM
      response.body.donors.forEach(donor => {
        expect(donor.pmm).toBe(testDonor.pmm);
      });

      // Our test donor should be in the results
      const foundDonor = response.body.donors.find(donor => donor.id === donorId.toString());
      expect(foundDonor).toBeTruthy();
    }, 10000);

    it('should search donors by name', async () => {
      const response = await request(app)
        .get(`/api/donors?search=${testDonor.firstName}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('donors');
      
      // Our test donor should be in the search results
      const foundDonor = response.body.donors.find(donor => 
        donor.id === donorId.toString() && 
        donor.firstName === testDonor.firstName &&
        donor.lastName === testDonor.lastName
      );
      expect(foundDonor).toBeTruthy();
    }, 10000);

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/donors');

      expect(response.status).toBe(401);
    }, 10000);
  });
});