import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import app from '../../src/index.js';

const testCsvPath = path.join(__dirname, '..', 'fixtures', 'test-donors.csv');
const prisma = new PrismaClient();


// Increase timeout for database operations
jest.setTimeout(30000);


// Mock authentication middleware
jest.mock('../../src/middleware/auth.js', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { id: 1, role: 'pmm' };
    next();
  })
}));

describe('Donor Import Tests', () => {
  beforeAll(async () => {
    try {
      await prisma.$connect();
      
      // Verify the test CSV file exists
      if (!fs.existsSync(testCsvPath)) {
        console.warn(`Test CSV file not found at ${testCsvPath}. Some tests may fail.`);
      }
      
      // Clean up any existing test data with recognizable first and last names
      await prisma.donor.deleteMany({
        where: {
          OR: [
            { firstName: { equals: 'Mei' } },
            { firstName: { equals: 'Olga' } },
            { firstName: { equals: 'Sergei' } }
          ]
        }
      });
    } catch (error) {
      console.error('Setup error:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      // Clean up test data
      await prisma.donor.deleteMany({
        where: {
          OR: [
            { firstName: { equals: 'Mei' } },
            { firstName: { equals: 'Olga' } },
            { firstName: { equals: 'Sergei' } }
          ]
        }
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    } finally {
      await prisma.$disconnect();
    }
  });

  it('should import donors from CSV file', async () => {
    // Skip the test if the CSV file doesn't exist
    if (!fs.existsSync(testCsvPath)) {
      console.warn('Skipping test: CSV file not found');
      return;
    }
    
    // Log CSV content to verify it's being read correctly
    const csvContent = fs.readFileSync(testCsvPath, 'utf8');
    console.log('CSV first 200 chars:', csvContent.substring(0, 200));
    
    // Use the existing CSV file
    const response = await request(app)
      .post('/api/donors/import')
      .attach('file', testCsvPath);
    
    console.log('Import response:', JSON.stringify(response.body, null, 2));
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('imported');
    expect(response.body.imported).toBeGreaterThanOrEqual(1);
    
    // Check what donors actually exist in the database after import
    const allDonors = await prisma.donor.findMany({
      take: 5 // Limit to first 5 results for logging
    });
    
    console.log('Donors in database after import:', JSON.stringify(allDonors, null, 2));
    
    // Check specifically for the Mei Lee donor with more flexible criteria
    const importedDonor = await prisma.donor.findFirst({
      where: { 
        OR: [
          // Try different field name variations
          { firstName: 'Mei' }        ]
      }
    });
    
    console.log('Found donor:', importedDonor);
    
    expect(importedDonor).toBeTruthy();
    
    // If we found the donor, verify its properties
    if (importedDonor) {
      // Try different field name patterns (camelCase vs snake_case)
      const pmm = importedDonor.pmm || importedDonor.Pmm;
      const city = importedDonor.city || importedDonor.City;
      const nickName = importedDonor.nickName || importedDonor.nick_name;
      
      expect(pmm).toBe('Parvati Patel');
      expect(city).toBe('North Vancouver');
      expect(nickName).toBe('Sunshine');
    }
  });

  describe('Error handling during import', () => {
    it('should return 400 if no file is uploaded', async () => {
      const response = await request(app)
        .post('/api/donors/import');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'No file uploaded');
    });
  });
});