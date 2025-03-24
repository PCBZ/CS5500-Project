#!/usr/bin/env node

/**
 * Script to import generated test event data into the database
 * Usage: node importTestEvents.js <data_file_path>
 * Example: node importTestEvents.js ./testEvents.json
 */

// Import required libraries
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Import event data into the database
 * @param {Array} events - Array of event data
 * @returns {Promise<Array>} Array of imported event IDs
 */
async function importEvents(events) {
  console.log(`Importing ${events.length} events...`);
  const importedEvents = [];
  
  for (const event of events) {
    try {
      // Create event
      const createdEvent = await prisma.event.create({
        data: {
          name: event.name,
          type: event.type,
          date: new Date(event.date),
          location: event.location,
          capacity: parseInt(event.capacity),
          focus: event.focus,
          criteriaMinGivingLevel: parseFloat(event.criteriaMinGivingLevel || 0),
          timelineListGenerationDate: event.timelineListGenerationDate ? new Date(event.timelineListGenerationDate) : null,
          timelineReviewDeadline: event.timelineReviewDeadline ? new Date(event.timelineReviewDeadline) : null,
          timelineInvitationDate: event.timelineInvitationDate ? new Date(event.timelineInvitationDate) : null,
          status: event.status,
          createdBy: 1, // Assuming user ID is 1, make sure this user exists
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      importedEvents.push({
        originalId: event.id,
        newId: createdEvent.id
      });
      
      console.log(`  ✓ Event "${event.name}" (ID: ${createdEvent.id}) imported successfully`);
    } catch (error) {
      console.error(`  ✗ Failed to import event "${event.name}":`, error.message);
    }
  }
  
  return importedEvents;
}

/**
 * Import donor data into the database
 * @param {Array} donors - Array of donor data
 * @returns {Promise<Array>} Mapping of imported donor IDs
 */
async function importDonors(donors) {
  console.log(`Importing ${donors.length} donors...`);
  const importedDonors = [];
  
  for (const donor of donors) {
    try {
      // Convert tags to database format
      const tags = donor.tags ? JSON.stringify(donor.tags) : null;
      
      // Create donor
      const createdDonor = await prisma.donor.create({
        data: {
          pmm: donor.pmm,
          excluded: !!donor.excluded,
          deceased: !!donor.deceased,
          firstName: donor.firstName,
          lastName: donor.lastName,
          organizationName: donor.organizationName,
          totalDonations: parseFloat(donor.totalDonations || 0),
          largestGift: parseFloat(donor.largestGift || 0),
          firstGiftDate: donor.firstGiftDate ? new Date(donor.firstGiftDate) : null,
          lastGiftDate: donor.lastGiftDate ? new Date(donor.lastGiftDate) : null,
          lastGiftAmount: parseFloat(donor.lastGiftAmount || 0),
          city: donor.city,
          tags: tags
        }
      });
      
      importedDonors.push({
        originalId: donor.id,
        newId: createdDonor.id,
        status: donor.status
      });
      
      // Output progress every 100 records
      if (importedDonors.length % 100 === 0) {
        console.log(`  Imported ${importedDonors.length} donors...`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to import donor (ID: ${donor.id}):`, error.message);
    }
  }
  
  console.log(`  ✓ Total ${importedDonors.length} donors imported`);
  return importedDonors;
}

/**
 * Create event donor lists and relationships
 * @param {Array} eventMapping - Event ID mapping
 * @param {Array} donorMapping - Donor ID mapping
 * @param {Object} eventDonors - Event-donor relationships
 * @param {Object} eventStats - Event-donor statistics
 */
async function createEventDonorRelationships(eventMapping, donorMapping, eventDonors, eventStats) {
  console.log('Creating event-donor relationships...');
  
  for (const eventMap of eventMapping) {
    const originalEventId = eventMap.originalId;
    const newEventId = eventMap.newId;
    
    if (!eventDonors[originalEventId] || eventDonors[originalEventId].length === 0) {
      console.log(`  Event ID ${newEventId} has no associated donors, skipping`);
      continue;
    }
    
    try {
      // Create donor list for event
      const donorList = await prisma.eventDonorList.create({
        data: {
          eventId: newEventId,
          name: `Donor List for Event ${newEventId}`,
          totalDonors: eventDonors[originalEventId].length,
          approved: eventStats[originalEventId]?.approved || 0,
          excluded: eventStats[originalEventId]?.excluded || 0,
          pending: eventStats[originalEventId]?.pending || 0,
          autoExcluded: 0,
          reviewStatus: 'pending',
          generatedBy: 1, // Assuming user ID is 1, make sure this user exists
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`  ✓ Created donor list for Event ID ${newEventId} with ${eventDonors[originalEventId].length} donors`);
      
      // Associate donors with event
      let addedDonors = 0;
      for (const originalDonorId of eventDonors[originalEventId]) {
        // Find new donor ID
        const donorMap = donorMapping.find(d => d.originalId === originalDonorId);
        
        if (donorMap) {
          // Randomly assign status
          let status;
          const statusRandom = Math.random();
          if (statusRandom < 0.7) {
            status = 'Approved';
          } else if (statusRandom < 0.9) {
            status = 'Pending';
          } else {
            status = 'Excluded';
          }
          
          await prisma.eventDonor.create({
            data: {
              donorListId: donorList.id,
              donorId: donorMap.newId,
              status: status,
              autoExcluded: false,
              reviewDate: status !== 'Pending' ? new Date() : null,
              reviewerId: status !== 'Pending' ? 1 : null, // Assuming user ID is 1
              comments: status === 'Excluded' ? 'Auto-excluded for testing' : null
            }
          });
          
          addedDonors++;
        }
      }
      
      console.log(`  ✓ Associated ${addedDonors} donors with Event ID ${newEventId}`);
      
    } catch (error) {
      console.error(`  ✗ Error creating donor associations for Event ID ${newEventId}:`, error.message);
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
      console.error('Error: Please provide test data file path');
      console.error('Usage: node importTestEvents.js <data_file_path>');
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
    if (!testData.MOCK_EVENTS || !testData.MOCK_DONORS || !testData.MOCK_EVENT_DONORS) {
      console.error('Error: Data file has incorrect format, missing required data sections');
      process.exit(1);
    }
    
    console.log('Starting test data import...');
    
    // 1. Import events
    const eventMapping = await importEvents(testData.MOCK_EVENTS);
    
    // 2. Import donors
    const donorMapping = await importDonors(testData.MOCK_DONORS);
    
    // 3. Create event-donor relationships
    await createEventDonorRelationships(
      eventMapping, 
      donorMapping, 
      testData.MOCK_EVENT_DONORS, 
      testData.MOCK_EVENT_STATS
    );
    
    console.log('Test data import completed!');
    
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute main function
main(); 