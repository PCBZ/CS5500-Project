#!/usr/bin/env node

/**
 * Upload test data through HTTP API
 * Usage: node uploadTestData.js <data_file_path>
 * Example: node uploadTestData.js ./activeEvents.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API base URL
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

/**
 * Login to get authentication token
 * @returns {Promise<string>} Authentication token
 */
async function login() {
  try {
    console.log('Logging in to get authentication token...');
    const response = await fetch(`${API_BASE_URL}/api/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'password123'
      })
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText} (${response.status})`);
    }

    const data = await response.json();
    if (!data.token) {
      throw new Error('No token found in login response');
    }

    console.log('✓ Authentication token obtained successfully');
    return data.token;
  } catch (error) {
    console.error('Failed to get token:', error.message);
    throw error;
  }
}

/**
 * Upload event data
 * @param {Array} events Event data
 * @param {string} token Authentication token
 * @returns {Promise<Array>} Mapping of uploaded event IDs
 */
async function uploadEvents(events, token) {
  console.log(`Uploading ${events.length} events...`);
  const uploadedEvents = [];

  for (const event of events) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: event.name,
          type: event.type,
          date: event.date,
          location: event.location,
          capacity: parseInt(event.capacity),
          focus: event.focus,
          criteriaMinGivingLevel: parseFloat(event.criteriaMinGivingLevel || 0),
          timelineListGenerationDate: event.timelineListGenerationDate,
          timelineReviewDeadline: event.timelineReviewDeadline,
          timelineInvitationDate: event.timelineInvitationDate,
          status: event.status
        })
      });

      if (!response.ok) {
        throw new Error(`API error response: ${response.statusText} (${response.status})`);
      }

      const responseData = await response.json();
      const createdEvent = responseData.event || responseData;
      const donorList = responseData.donorList;
      
      uploadedEvents.push({
        originalId: event.id,
        newId: createdEvent.id,
        donorListId: donorList ? donorList.id : null
      });

      console.log(`  ✓ Event "${event.name}" (ID: ${createdEvent.id}) uploaded successfully${donorList ? ' with donor list ID: ' + donorList.id : ''}`);
    } catch (error) {
      console.error(`  ✗ Failed to upload event "${event.name}":`, error.message);
    }
  }

  return uploadedEvents;
}

/**
 * Upload donor data
 * @param {Array} donors Donor data
 * @param {string} token Authentication token
 * @returns {Promise<Array>} Mapping of uploaded donor IDs
 */
async function uploadDonors(donors, token) {
  console.log(`Uploading ${donors.length} donors...`);
  const uploadedDonors = [];

  for (const donor of donors) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/donors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: donor.firstName,
          lastName: donor.lastName,
          organizationName: donor.organizationName,
          pmm: donor.pmm,
          excluded: donor.excluded || false,
          deceased: donor.deceased || false,
          city: donor.city,
          totalDonations: parseFloat(donor.totalDonations || 0),
          largestGift: parseFloat(donor.largestGift || 0),
          firstGiftDate: donor.firstGiftDate,
          lastGiftDate: donor.lastGiftDate,
          lastGiftAmount: parseFloat(donor.lastGiftAmount || 0),
          type: donor.type,
          priority: donor.priority,
          tags: donor.tags || []
        })
      });

      if (!response.ok) {
        throw new Error(`API error response: ${response.statusText} (${response.status})`);
      }

      const createdDonor = await response.json();
      uploadedDonors.push({
        originalId: donor.id,
        newId: createdDonor.id
      });

      console.log(`  ✓ Donor "${donor.firstName} ${donor.lastName}" (ID: ${createdDonor.id}) uploaded successfully`);
    } catch (error) {
      console.error(`  ✗ Failed to upload donor "${donor.firstName} ${donor.lastName}":`, error.message);
    }
  }

  return uploadedDonors;
}

/**
 * Create event-donor relationships
 * @param {Array} eventMapping Event ID mapping
 * @param {Array} donorMapping Donor ID mapping
 * @param {Object} eventDonors Event-donor relationships
 * @param {string} token Authentication token
 */
async function createEventDonorRelationships(eventMapping, donorMapping, eventDonors, token) {
  console.log('Creating event-donor relationships...');

  for (const eventMap of eventMapping) {
    const originalEventId = eventMap.originalId;
    const newEventId = eventMap.newId;
    const donorListId = eventMap.donorListId;

    if (!eventDonors[originalEventId] || eventDonors[originalEventId].length === 0) {
      console.log(`  Event ID ${newEventId} has no associated donors, skipping`);
      continue;
    }

    try {
      // For each associated donor, add to the event's donor list
      let addedDonors = 0;
      
      // Prepare donor arrays to batch add
      const donorsToAdd = [];
      
      for (const originalDonorId of eventDonors[originalEventId]) {
        // Find the new donor ID
        const donorMap = donorMapping.find(d => d.originalId === originalDonorId);
        
        if (donorMap) {
          donorsToAdd.push({
            donor_id: donorMap.newId,
            status: Math.random() < 0.7 ? 'Approved' : (Math.random() < 0.5 ? 'Pending' : 'Excluded'),
            comments: 'Added via test data script'
          });
        }
      }
      
      // If we have a donor list ID, use the donor-lists API endpoint
      if (donorListId && donorsToAdd.length > 0) {
        const response = await fetch(`${API_BASE_URL}/api/donor-lists/${donorListId}/donors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            donors: donorsToAdd
          })
        });
        
        if (response.ok) {
          addedDonors = donorsToAdd.length;
        } else {
          const errorData = await response.text();
          console.error(`  ✗ Error response when adding donors to list: ${response.status} ${response.statusText}`, errorData);
        }
      } 
      // Fallback to individual donor addition to event if no donor list ID
      else if (donorsToAdd.length > 0) {
        for (const donorData of donorsToAdd) {
          const response = await fetch(`${API_BASE_URL}/api/events/${newEventId}/donors`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              donorId: donorData.donor_id,
              status: donorData.status
            })
          });
          
          if (response.ok) {
            addedDonors++;
          }
        }
      }

      console.log(`  ✓ Added ${addedDonors} donors to event ID ${newEventId}`);
    } catch (error) {
      console.error(`  ✗ Error creating donor associations for event ID ${newEventId}:`, error.message);
    }
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Get command line arguments
    const dataFilePath = process.argv[2];

    if (!dataFilePath) {
      console.error('Error: Please provide the test data file path');
      console.error('Usage: node uploadTestData.js <data_file_path>');
      process.exit(1);
    }

    // Read data file
    const fullPath = path.resolve(process.cwd(), dataFilePath);

    if (!fs.existsSync(fullPath)) {
      console.error(`Error: File ${fullPath} does not exist`);
      process.exit(1);
    }

    console.log(`Reading test data from ${fullPath}...`);
    const jsonData = fs.readFileSync(fullPath, 'utf8');
    const testData = JSON.parse(jsonData);

    // Validate data structure
    if (!testData.MOCK_EVENTS || !testData.MOCK_DONORS) {
      console.error('Error: Incorrect data file format, missing required data sections');
      process.exit(1);
    }

    // Get authentication token
    const token = await login();

    console.log('Starting test data upload...');

    // 1. Upload events
    const eventMapping = await uploadEvents(testData.MOCK_EVENTS, token);

    // 2. Upload donors
    const donorMapping = await uploadDonors(testData.MOCK_DONORS, token);

    // 3. Create event-donor relationships
    if (testData.MOCK_EVENT_DONORS) {
      await createEventDonorRelationships(
        eventMapping,
        donorMapping,
        testData.MOCK_EVENT_DONORS,
        token
      );
    }

    console.log('Test data upload completed!');

  } catch (error) {
    console.error('Error uploading data:', error);
    process.exit(1);
  }
}

// Execute main function
main(); 