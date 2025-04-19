const { PrismaClient, Role, DonorStatus, EventStatus, ReviewStatus } = require('@prisma/client');
const { hashSync } = require('bcrypt');
const fetch = require('node-fetch');

const prisma = new PrismaClient();
const API_URL = 'https://bc-cancer-faux.onrender.com/donors?format=json';

// Generate random date (1-5 years in the past)
function randomDate(start = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000), end = new Date()) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function: Convert string date to date object
function parseDate(dateString) {
  if (!dateString || dateString === '0') return null;
  // Try to convert Unix timestamp to date
  const timestamp = parseInt(dateString);
  if (!isNaN(timestamp)) {
    return new Date(timestamp * 1000); // Convert to milliseconds
  }
  return null;
}

// Helper function: Convert string amount to number
function parseAmount(amountString) {
  if (!amountString || amountString === '0') return 0;
  const amount = parseFloat(amountString);
  return isNaN(amount) ? 0 : amount;
}

async function main() {
  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.eventDonor.deleteMany({});
  await prisma.eventDonorList.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.donor.deleteMany({});
  await prisma.user.deleteMany({});
  
  console.log('Creating users...');
  // Create users
  const adminUser = await prisma.user.create({
    data: {
      name: 'Administrator',
      email: 'admin@example.com',
      password: hashSync('password123', 10),
      role: Role.pmm
    }
  });

  const regularUser = await prisma.user.create({
    data: {
      name: 'Regular User',
      email: 'user@example.com',
      password: hashSync('password123', 10),
      role: Role.vmm
    }
  });

  console.log('Fetching donor data from API...');
  let donorData;
  try {
    // Fetch data from API
    const response = await fetch(API_URL);
    donorData = await response.json();
    console.log(`Successfully retrieved ${donorData.data.length} donor records`);
  } catch (error) {
    console.error('Failed to fetch data from API:', error);
    // Use hardcoded data as fallback
    donorData = {
      "headers": ["pmm", "smm", "vmm", "exclude", "deceased", "first_name", "nick_name", "last_name", "organization_name", "total_donations", "total_pledge", "largest_gift", "largest_gift_appeal", "first_gift_date", "last_gift_date", "last_gift_amount", "last_gift_request", "last_gift_appeal", "address_line1", "address_line2", "city", "contact_phone_type", "phone_restrictions", "email_restrictions", "communication_restrictions", "subscription_events_in_person", "subscription_events_magazine", "communication_preference"],
      "data": [
        ["Parvati Patel","Bob Brown","Olga Smirnov","no","no","Mei","Sunshine","Lee","",0,892678,0,"Appeal2",0,0,0,1718294838,"Appeal3","707 Redwood Terrace","Apt 444","North Vancouver","Home","Do Not Call","No Surveys","","Opt-out","Opt-in","Event"],
        ["Peter Smith","Jane Doe","Sven Müller","no","no","Olga","Pumpkin","Nguyen","",171909,193633,146175,"Appeal3",1726699246,100790736,135047,1715578432,"Appeal2","707 Redwood Terrace","Apt 909","Saanich","Home","No Mass Communications","Do Not Email","No Mass Communications","Opt-in","Opt-out","Inspiration event"],
        ["Gurtrude Schmidt","John Doe","Chao Nguyen","no","no","Sergei","","王","",338504,0,172858,"Appeal2",1623566235,805985286,159424,1711829613,"Appeal1","555 Hickory Drive","Unit 777","Parksville","Mobile","","No Mass Appeals","No Surveys","Opt-out","Opt-in","Newsletter"],
        ["Hiroshi Nakamura","Bob Brown","Priya Gupta","yes","no","Dimitri","Pumpkin","Hernández","",446577,985788,420888,"Appeal1",1594467427,1150728314,112157,1710754678,"Appeal3","222 Sycamore Lane","Unit 232","White Rock","Mobile","No Surveys","Do Not Email","No Mass Appeals","Opt-out","Opt-in",""],
        ["Hiroshi Nakamura","Bob Brown","Olga Smirnov","no","no","Olga","Love","Smith","",512035,94936,382574,"Appeal3",1628741903,1034796590,104615,1722370561,"Appeal3","898 Willowwood Road","Unit 111","Coquitlam","Home","Do Not Call","Do Not Email","No Mass Appeals","Opt-out","Opt-in","Inspiration event"],
        ["Hiroshi Nakamura","Alice Smith","Olga Smirnov","no","no","Juan","","Cohen","",119657,0,24803,"Appeal3",1705162369,1330231881,928,1738960538,"Appeal3","1414 Sycamorewood Avenue","Unit 999","West Vancouver","Work","Do Not Call","","","Opt-in","Opt-in","Appeal"],
        ["Hiroshi Nakamura","Bob Brown","Priya Gupta","yes","no","Fatima","Angel","Singh","",659602,867681,187481,"Appeal2",1589011832,361345781,22790,1738061741,"Appeal2","909 Aspenwood Way","Unit 777","West Vancouver","Work","No Mass Communications","","No Surveys","Opt-in","Opt-out","Magazine"],
        ["Hiroshi Nakamura","Bob Brown","Priya Gupta","no","no","Ahmed","","Müller","",832155,0,473701,"Appeal3",1659889344,1413963296,32666,1711101526,"Appeal2","121 Maplewood Place","Unit 999","New Westminster","Mobile","No Mass Appeals","","No Surveys","Opt-out","Opt-out","Survey"],
        ["Gurtrude Schmidt","Jane Doe","Chao Nguyen","no","no","Carlos","Angel","Иванов","Wacky Widgets",31138,982046,29677,"Appeal2",1621955196,990423081,1268,1733678292,"Appeal3","606 Aspen Circle","Apt 909","Victoria","Home","No Surveys","No Mass Communications","","Opt-out","Opt-out","Survey"],
        ["Parvati Patel","Bob Brown","Olga Smirnov","no","no","Ingrid","","Gupta","",144274,77676,143941,"Appeal2",1663215262,137566018,75859,1713221439,"Appeal3","303 Elm Drive","Apt 505","North Vancouver","Home","No Mass Communications","No Surveys","No Mass Communications","Opt-out","Opt-in","Holiday Card"]
      ]
    };
    console.log('Using hardcoded fallback data');
  }

  console.log('Creating donors...');
  const donors = [];
  // Map API data to database model
  for (const row of donorData.data) {
    const headerToIndex = {};
    donorData.headers.forEach((header, index) => {
      headerToIndex[header] = index;
    });

    // Create donor data
    const donorDataObj = {
      pmm: row[headerToIndex.pmm],
      smm: row[headerToIndex.smm],
      vmm: row[headerToIndex.vmm],
      excluded: row[headerToIndex.exclude]?.toLowerCase() === 'yes',
      deceased: row[headerToIndex.deceased]?.toLowerCase() === 'yes',
      firstName: row[headerToIndex.first_name] || null,
      nickName: row[headerToIndex.nick_name] || null,
      lastName: row[headerToIndex.last_name] || null,
      organizationName: row[headerToIndex.organization_name] || null,
      totalDonations: parseAmount(row[headerToIndex.total_donations]),
      totalPledges: parseAmount(row[headerToIndex.total_pledge]),
      largestGift: parseAmount(row[headerToIndex.largest_gift]),
      largestGiftAppeal: row[headerToIndex.largest_gift_appeal] || null,
      firstGiftDate: parseDate(row[headerToIndex.first_gift_date]),
      lastGiftDate: parseDate(row[headerToIndex.last_gift_date]),
      lastGiftAmount: parseAmount(row[headerToIndex.last_gift_amount]),
      lastGiftRequest: row[headerToIndex.last_gift_request] ? String(row[headerToIndex.last_gift_request]) : null,
      lastGiftAppeal: row[headerToIndex.last_gift_appeal] || null,
      addressLine1: row[headerToIndex.address_line1] || null,
      addressLine2: row[headerToIndex.address_line2] || null,
      city: row[headerToIndex.city] || null,
      contactPhoneType: row[headerToIndex.contact_phone_type] || null,
      phoneRestrictions: row[headerToIndex.phone_restrictions] || null,
      emailRestrictions: row[headerToIndex.email_restrictions] || null,
      communicationRestrictions: row[headerToIndex.communication_restrictions] || null,
      subscriptionEventsInPerson: row[headerToIndex.subscription_events_in_person] || null,
      subscriptionEventsMagazine: row[headerToIndex.subscription_events_magazine] || null,
      communicationPreference: row[headerToIndex.communication_preference] || null,
      tags: 'API Import'
    };

    try {
      const donor = await prisma.donor.create({ data: donorDataObj });
      donors.push(donor);
    } catch (error) {
      console.error('Failed to create donor:', error);
    }
  }

  console.log('Creating events...');
  // Create 3 events
  const events = [];
  const eventTypes = ['Gala Dinner', 'Charity Concert', 'Auction', 'Charity Run'];
  const eventLocations = ['New York Convention Center', 'Chicago Exhibition Hall', 'San Francisco Opera House', 'Los Angeles Convention Center'];
  const eventFocus = ['Education', 'Healthcare', 'Disaster Relief', 'Environment'];
  
  for (let i = 0; i < 3; i++) {
    const eventDate = new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000);
    
    try {
      const event = await prisma.event.create({
        data: {
          name: `Fundraising Event ${i + 1}`,
          type: eventTypes[i % 4],
          date: eventDate,
          location: eventLocations[i % 4],
          capacity: 100 + i * 50,
          focus: eventFocus[i % 4],
          criteriaMinGivingLevel: 500 * (i + 1),
          timelineListGenerationDate: new Date(eventDate.getTime() - 60 * 24 * 60 * 60 * 1000),
          timelineReviewDeadline: new Date(eventDate.getTime() - 45 * 24 * 60 * 60 * 1000),
          timelineInvitationDate: new Date(eventDate.getTime() - 30 * 24 * 60 * 60 * 1000),
          status: [EventStatus.Planning, EventStatus.ListGeneration, EventStatus.Review][i % 3],
          createdBy: adminUser.id
        }
      });
      
      events.push(event);
    } catch (error) {
      console.error(`Failed to create event ${i + 1}:`, error);
    }
  }

  console.log('Creating donor lists...');
  // Create a donor list for each event
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    
    try {
      const donorList = await prisma.eventDonorList.create({
        data: {
          eventId: event.id,
          name: `${event.name} Donor List`,
          generatedBy: adminUser.id,
        }
      });
      
      console.log(`Adding donors to event ${event.name}...`);
      // Add up to 20 donors to each list
      const donorCount = Math.min(donors.length, 20);
      
      for (let j = 0; j < donorCount; j++) {
        const donor = donors[j];
        
        // Randomly assign status
        const status = Math.random() > 0.8 
          ? DonorStatus.Excluded 
          : (Math.random() > 0.5 ? DonorStatus.Approved : DonorStatus.Pending);
        
        // Exclusion reasons
        const exclusionReasons = [
          'Does not meet criteria', 
          'Already attending another event', 
          'Cannot be contacted', 
          'Declined invitation'
        ];
        
        // Comment options
        const commentOptions = [
          'Important donor, needs special attention',
          'High historical donation amount',
          'First-time participant',
          'Requires special seating arrangement'
        ];
        
        try {
          // Create EventDonor record
          await prisma.eventDonor.create({
            data: {
              donorListId: donorList.id,
              donorId: donor.id,
              status: status,
              excludeReason: status === DonorStatus.Excluded 
                ? exclusionReasons[Math.floor(Math.random() * exclusionReasons.length)]
                : null,
              reviewerId: Math.random() > 0.7 ? adminUser.id : null,
              reviewDate: Math.random() > 0.7 ? randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) : null,
              comments: Math.random() > 0.8 
                ? commentOptions[Math.floor(Math.random() * commentOptions.length)]
                : null,
              autoExcluded: Math.random() > 0.9
            }
          });
        } catch (error) {
          console.error(`Failed to add donor ${donor.id} to event ${event.name}:`, error);
        }
      }
      
      // Update list statistics
      try {
        const stats = await prisma.eventDonor.groupBy({
          by: ['status'],
          where: {
            donorListId: donorList.id
          },
          _count: {
            _all: true
          }
        });
        
        let approved = 0, excluded = 0, pending = 0, autoExcluded = 0;
        
        stats.forEach(stat => {
          if (stat.status === DonorStatus.Approved) approved = stat._count._all;
          else if (stat.status === DonorStatus.Excluded) excluded = stat._count._all;
          else if (stat.status === DonorStatus.Pending) pending = stat._count._all;
          else if (stat.status === DonorStatus.AutoExcluded) autoExcluded = stat._count._all;
        });
        
        await prisma.eventDonorList.update({
          where: { id: donorList.id },
          data: {
            totalDonors: donorCount,
            approved,
            excluded,
            pending,
            autoExcluded,
            reviewStatus: pending === 0 ? ReviewStatus.completed : ReviewStatus.pending
          }
        });
      } catch (error) {
        console.error(`Failed to update donor list ${donorList.id} statistics:`, error);
      }
    } catch (error) {
      console.error(`Failed to create donor list for event ${event.name}:`, error);
    }
  }

  console.log('Test data creation completed!');
}

main()
  .catch(e => {
    console.error('Error creating test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 