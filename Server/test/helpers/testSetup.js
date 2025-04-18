/**
 * Helper functions for test setup and cleanup
 */

import bcrypt from 'bcrypt';
import app from '../../src/index.js';

let server;

/**
 * Sets up a test user in the database if it doesn't exist
 * @param {object} prisma - PrismaClient instance
 * @param {object} userData - Test user data (name, email, role)
 * @returns {object} The created or existing user with ID
 */
export const setupTestUser = async (prisma, userData) => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email }
  });
  
  if (existingUser) {
    console.log(`Test user ${userData.email} already exists, skipping creation`);
    return {
      ...userData,
      id: existingUser.id
    };
  }
  
  // Create a test user
  console.log(`Creating test user ${userData.email}`);
  const hashedPassword = await bcrypt.hash('testpassword', 10);
  
  const user = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role
    }
  });
  
  return {
    ...userData,
    id: user.id
  };
};

/**
 * Cleans up test events from the database
 * @param {object} prisma - PrismaClient instance
 */
export const cleanupTestEvents = async (prisma) => {
  await prisma.event.deleteMany({
    where: {
      name: {
        contains: 'Test'
      }
    }
  });
  console.log('Cleaned up test events');
};

/**
 * Creates an event for testing purposes
 * @param {object} prisma - PrismaClient instance
 * @param {object} eventData - Event data
 * @returns {object} The created event
 */
export const createTestEvent = async (prisma, eventData) => {
  const event = await prisma.event.create({
    data: eventData
  });
  
  return event;
};

export const startTestServer = async (port = 5001) => {
  if (!server) {
    server = app.listen(port);
    console.log(`Test server started on port ${port}`);
  }
  return server;
};

export const stopTestServer = async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
    server = null;
    console.log('Test server stopped');
  }
};

export const getTestServer = () => server;