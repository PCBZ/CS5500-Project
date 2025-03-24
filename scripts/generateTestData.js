#!/usr/bin/env node

/**
 * Script to generate test event data
 * Usage: node generateTestData.js [count] > testEvents.json
 * Example: node generateTestData.js 20 > testEvents.json
 */

// Import required libraries
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define possible event types
const EVENT_TYPES = [
  'Major Donor Event',
  'Research Symposium',
  'Community Event',
  'Corporate Partners Summit',
  'Charity Auction',
  'Fundraising Dinner',
  'Medical Education Lecture',
  'Awards Ceremony',
  'Online Donation Event',
  'Volunteer Appreciation'
];

// Define possible event locations
const EVENT_LOCATIONS = [
  'Vancouver',
  'Victoria',
  'Kelowna',
  'Whistler',
  'Prince George',
  'Penticton',
  'Nanaimo',
  'Kamloops',
  'Richmond',
  'Abbotsford',
  'Surrey',
  'Burnaby',
  'North Vancouver',
  'Langley',
  'Delta'
];

// Define possible event focus areas
const EVENT_FOCUS_AREAS = [
  'Cancer Research',
  'Children\'s Health',
  'Medical Innovation',
  'Emergency Medical Services',
  'Long-term Care',
  'Medical Education',
  'Community Health Programs',
  'Elderly Care',
  'Hospital Development',
  'Medical Equipment',
  'Mental Health',
  'Women\'s Health',
  'Chronic Disease Management',
  'Health Equity',
  'Preventive Medicine'
];

// Define possible event statuses
const EVENT_STATUSES = [
  'Planning',
  'ListGeneration',
  'Review',
  'Ready', 
  'Complete'
];

// Generate random date
function generateRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Generate random event
function generateEvent(id) {
  const now = new Date();
  const nextYear = new Date();
  nextYear.setFullYear(now.getFullYear() + 2);
  
  const eventDate = generateRandomDate(now, nextYear);
  
  // Calculate reasonable timeline dates
  const listGenDate = new Date(eventDate);
  listGenDate.setMonth(eventDate.getMonth() - 3);
  
  const reviewDeadline = new Date(eventDate);
  reviewDeadline.setMonth(eventDate.getMonth() - 2);
  
  const invitationDate = new Date(eventDate);
  invitationDate.setMonth(eventDate.getMonth() - 1);

  // Create a meaningful name for the event
  const year = eventDate.getFullYear();
  const eventType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
  const focusArea = EVENT_FOCUS_AREAS[Math.floor(Math.random() * EVENT_FOCUS_AREAS.length)];
  const eventName = `${year} ${focusArea} ${eventType}`;
  
  return {
    id: id,
    name: eventName,
    type: eventType,
    date: eventDate.toISOString(),
    location: EVENT_LOCATIONS[Math.floor(Math.random() * EVENT_LOCATIONS.length)],
    capacity: Math.floor(Math.random() * 300) + 50, // 50-350 capacity
    focus: focusArea,
    criteriaMinGivingLevel: Math.floor(Math.random() * 5) * 5000 + 5000, // 5000-25000
    timelineListGenerationDate: listGenDate.toISOString(),
    timelineReviewDeadline: reviewDeadline.toISOString(),
    timelineInvitationDate: invitationDate.toISOString(),
    status: EVENT_STATUSES[Math.floor(Math.random() * EVENT_STATUSES.length)],
    createdBy: 1 // Assuming user ID is 1
  };
}

// Generate donor names
function generateName() {
  const firstNames = [
    'James', 'Robert', 'John', 'Michael', 'David', 'William', 'Richard', 'Joseph', 'Thomas', 'Charles',
    'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
    'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth',
    'Margaret', 'Lisa', 'Nancy', 'Betty', 'Sandra', 'Ashley', 'Kimberly', 'Donna', 'Emily', 'Michelle'
  ];
  
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson',
    'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White',
    'Lopez', 'Lee', 'Gonzalez', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Perez', 'Hall',
    'Young', 'Allen', 'Sanchez', 'Wright', 'King', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson'
  ];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return { firstName, lastName, fullName: firstName + ' ' + lastName };
}

// Generate random company name
function generateCompanyName() {
  const prefixes = ['Global', 'Advanced', 'United', 'National', 'Premier', 'Elite', 'First', 'Dynamic', 'Pacific', 'Atlantic', 'Alliance', 'Nova', 'Summit', 'Horizon', 'Central', 'Innovative', 'Strategic', 'Excel', 'Prime', 'Vital'];
  const middleParts = ['Tech', 'Health', 'Med', 'Bio', 'Care', 'Life', 'Science', 'Trust', 'Cure', 'Wellness', 'Vision', 'Smart', 'Synergy', 'Connect', 'Direct', 'Link', 'Net', 'Insight', 'Core', 'Apex'];
  const suffixes = ['Corp', 'Systems', 'Healthcare', 'Solutions', 'Industries', 'Technologies', 'Partners', 'Group', 'Associates', 'International', 'Enterprises', 'Services', 'Innovations', 'Dynamics', 'Therapeutics', 'Foundations', 'Networks', 'Research', 'Labs', 'Ventures'];
  
  return prefixes[Math.floor(Math.random() * prefixes.length)] + ' ' + 
         middleParts[Math.floor(Math.random() * middleParts.length)] + ' ' + 
         suffixes[Math.floor(Math.random() * suffixes.length)];
}

// Generate random donor
function generateDonor(id) {
  // Randomly decide if it's an individual or organization
  const isOrganization = Math.random() > 0.7;
  
  // Generate basic information
  const person = isOrganization ? null : generateName();
  const orgName = isOrganization ? generateCompanyName() : null;
  
  // Calculate donation history
  const totalDonations = Math.floor(Math.random() * 990000) + 10000; // 10,000 - 1,000,000
  const largestGift = Math.floor(totalDonations * (Math.random() * 0.5 + 0.3)); // 30%-80% of total donations
  
  // Generate history dates
  const now = new Date();
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(now.getFullYear() - 3);
  
  const firstGiftDate = generateRandomDate(threeYearsAgo, now);
  const lastGiftDate = generateRandomDate(firstGiftDate, now);
  
  // Donor types
  const donorTypes = ['Major Donor', 'Corporate Donor', 'Individual Donor', 'Community Donor', 'Foundation'];
  const priorities = ['High', 'Medium', 'Low'];
  const tags = ['Cancer Research', 'Children\'s Health', 'Medical Innovation', 'Emergency Services', 'Long-term Care', 'Medical Education', 'Community Health', 'Elderly Care', 'VIP', 'High Potential', 'Needs Attention'];
  
  // Select 1-3 random tags
  const selectedTags = [];
  const numTags = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < numTags; i++) {
    const tag = tags[Math.floor(Math.random() * tags.length)];
    if (!selectedTags.includes(tag)) {
      selectedTags.push(tag);
    }
  }
  
  return {
    id: id,
    pmm: Math.random() > 0.3 ? ['James Wilson', 'Emily Parker', 'Michael Brown', 'Sarah Johnson', 'Robert Miller'][Math.floor(Math.random() * 5)] : null,
    excluded: Math.random() < 0.05, // 5% chance of being excluded
    deceased: Math.random() < 0.02, // 2% chance of being deceased
    firstName: isOrganization ? null : person.firstName,
    lastName: isOrganization ? null : person.lastName,
    organizationName: orgName,
    totalDonations: totalDonations,
    largestGift: largestGift,
    firstGiftDate: firstGiftDate.toISOString(),
    lastGiftDate: lastGiftDate.toISOString(),
    lastGiftAmount: Math.floor(Math.random() * largestGift * 0.8) + largestGift * 0.2,
    city: ['Vancouver', 'Victoria', 'Kelowna', 'Abbotsford', 'Nanaimo', 'Kamloops', 'Prince George', 'Richmond', 'Surrey', 'Burnaby', 'Coquitlam', 'Langley', 'Delta', 'North Vancouver', 'West Vancouver'][Math.floor(Math.random() * 15)],
    type: donorTypes[Math.floor(Math.random() * donorTypes.length)],
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    tags: selectedTags
  };
}

// Generate event and donor relationships
function generateEventDonorRelationships(events, donors) {
  const eventDonors = {};
  const eventStats = {};
  
  events.forEach(event => {
    // Randomly select 15-50 donors for each event
    const numDonors = Math.floor(Math.random() * 35) + 15;
    const selectedDonors = [];
    
    // Initialize statistics
    eventStats[event.id] = { pending: 0, approved: 0, excluded: 0 };
    
    // Randomly select non-duplicate donors
    while (selectedDonors.length < numDonors && selectedDonors.length < donors.length) {
      const donorIndex = Math.floor(Math.random() * donors.length);
      const donorId = donors[donorIndex].id;
      
      if (!selectedDonors.includes(donorId)) {
        selectedDonors.push(donorId);
        
        // Randomly assign status
        const statusRandom = Math.random();
        if (statusRandom < 0.7) {
          // 70% are approved
          eventStats[event.id].approved++;
        } else if (statusRandom < 0.9) {
          // 20% are pending
          eventStats[event.id].pending++;
        } else {
          // 10% are excluded
          eventStats[event.id].excluded++;
        }
      }
    }
    
    eventDonors[event.id] = selectedDonors;
  });
  
  return { eventDonors, eventStats };
}

// Format data for SQL insert statements
function generateSqlInserts(events, donors, eventDonors, eventStats) {
  let sql = '-- SQL Script to insert test data\n\n';
  
  // Start transaction
  sql += 'START TRANSACTION;\n\n';
  
  // Insert events
  sql += '-- Insert Events\n';
  events.forEach(event => {
    sql += `INSERT INTO events (name, type, date, location, capacity, focus, criteriaMinGivingLevel, timelineListGenerationDate, timelineReviewDeadline, timelineInvitationDate, status, createdBy, createdAt, updatedAt) VALUES (
      '${event.name.replace(/'/g, "''")}',
      '${event.type.replace(/'/g, "''")}',
      '${event.date}',
      '${event.location.replace(/'/g, "''")}',
      ${event.capacity},
      '${event.focus.replace(/'/g, "''")}',
      ${event.criteriaMinGivingLevel},
      ${event.timelineListGenerationDate ? `'${event.timelineListGenerationDate}'` : 'NULL'},
      ${event.timelineReviewDeadline ? `'${event.timelineReviewDeadline}'` : 'NULL'},
      ${event.timelineInvitationDate ? `'${event.timelineInvitationDate}'` : 'NULL'},
      '${event.status}',
      ${event.createdBy},
      NOW(),
      NOW()
    );\n`;
  });
  
  sql += '\n-- Insert Donors\n';
  donors.forEach(donor => {
    sql += `INSERT INTO donors (pmm, excluded, deceased, firstName, lastName, organizationName, totalDonations, largestGift, firstGiftDate, lastGiftDate, lastGiftAmount, city, tags) VALUES (
      ${donor.pmm ? `'${donor.pmm.replace(/'/g, "''")}'` : 'NULL'},
      ${donor.excluded ? 1 : 0},
      ${donor.deceased ? 1 : 0},
      ${donor.firstName ? `'${donor.firstName.replace(/'/g, "''")}'` : 'NULL'},
      ${donor.lastName ? `'${donor.lastName.replace(/'/g, "''")}'` : 'NULL'},
      ${donor.organizationName ? `'${donor.organizationName.replace(/'/g, "''")}'` : 'NULL'},
      ${donor.totalDonations},
      ${donor.largestGift},
      ${donor.firstGiftDate ? `'${donor.firstGiftDate}'` : 'NULL'},
      ${donor.lastGiftDate ? `'${donor.lastGiftDate}'` : 'NULL'},
      ${donor.lastGiftAmount},
      ${donor.city ? `'${donor.city.replace(/'/g, "''")}'` : 'NULL'},
      ${donor.tags.length > 0 ? `'${JSON.stringify(donor.tags).replace(/'/g, "''")}'` : 'NULL'}
    );\n`;
  });
  
  sql += '\n-- Insert Event Donor Lists\n';
  events.forEach(event => {
    sql += `INSERT INTO event_donor_lists (eventId, name, totalDonors, approved, excluded, pending, autoExcluded, reviewStatus, generatedBy, createdAt, updatedAt) VALUES (
      ${event.id},
      'Donor List for Event ${event.id}',
      ${eventDonors[event.id].length},
      ${eventStats[event.id].approved},
      ${eventStats[event.id].excluded},
      ${eventStats[event.id].pending},
      0,
      'pending',
      1,
      NOW(),
      NOW()
    );\n`;
  });
  
  sql += '\n-- Note: The following commands would need to be adjusted based on actual database IDs\n';
  sql += '-- This script only provides a template for inserting the event-donor relationships\n';
  sql += '-- Use the command "SET @eventListId = LAST_INSERT_ID();" after each event_donor_list insert to capture the ID\n\n';
  
  // Complete transaction
  sql += 'COMMIT;\n';
  
  return sql;
}

// Main function
function main() {
  try {
    // Get command line args, default to generating 10 events
    const numEvents = process.argv[2] ? parseInt(process.argv[2]) : 10;
    const numDonors = numEvents * 5; // Donors are 5x the number of events
    const outputType = process.argv[3] || 'json'; // Either 'json' or 'sql'
    
    // Generate events
    const events = [];
    for (let i = 1; i <= numEvents; i++) {
      events.push(generateEvent(i));
    }
    
    // Generate donors
    const donors = [];
    for (let i = 101; i <= 100 + numDonors; i++) {
      donors.push(generateDonor(i));
    }
    
    // Generate event and donor relationships
    const { eventDonors, eventStats } = generateEventDonorRelationships(events, donors);
    
    if (outputType === 'sql') {
      // Generate SQL insert statements
      const sqlData = generateSqlInserts(events, donors, eventDonors, eventStats);
      console.log(sqlData);
      console.error(`Successfully generated SQL insert statements for ${events.length} events and ${donors.length} donors`);
    } else {
      // Assemble final data as JSON
      const mockData = {
        MOCK_EVENTS: events,
        MOCK_DONORS: donors,
        MOCK_EVENT_DONORS: eventDonors,
        MOCK_EVENT_STATS: eventStats
      };
      
      // Output JSON
      console.log(JSON.stringify(mockData, null, 2));
      console.error(`Successfully generated ${events.length} events and ${donors.length} donors as test data`);
    }
    
  } catch (error) {
    console.error('Error generating test data:', error);
    process.exit(1);
  }
}

// Execute main function
main(); 