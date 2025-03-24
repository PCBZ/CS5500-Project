// Temporary mock data - for development only

// Mock event data
export const MOCK_EVENTS = [
  {
    id: 1,
    name: 'Spring Gala 2025',
    type: 'Major Donor Event',
    date: '2025-03-15',
    location: 'Vancouver Convention Center',
    capacity: '200 attendees',
    review_deadline: '2025-02-20',
    status: 'active',
    donors_count: 85
  },
  {
    id: 2,
    name: 'Research Symposium 2025',
    type: 'Scientific Event',
    date: '2025-04-22',
    location: 'BC Cancer Research Center',
    capacity: '150 attendees',
    review_deadline: '2025-03-30',
    status: 'active',
    donors_count: 65
  },
  {
    id: 3,
    name: 'Patient Care Fundraiser',
    type: 'Community Event',
    date: '2025-05-10',
    location: 'Stanley Park',
    capacity: '300 attendees',
    review_deadline: '2025-04-15',
    status: 'active',
    donors_count: 120
  },
  {
    id: 4,
    name: 'Corporate Partners Summit',
    type: 'Business Event',
    date: '2025-06-08',
    location: 'Four Seasons Hotel',
    capacity: '100 attendees',
    review_deadline: '2025-05-15',
    status: 'planned',
    donors_count: 40
  },
  {
    id: 5,
    name: 'Winter Charity Ball',
    type: 'Major Donor Event',
    date: '2024-12-05',
    location: 'Fairmont Hotel',
    capacity: '250 attendees',
    review_deadline: '2024-11-10',
    status: 'active',
    donors_count: 95
  },
  {
    id: 6,
    name: 'Medical Innovation Symposium 2025',
    type: 'Scientific Event',
    date: '2025-07-12',
    location: 'Beijing International Convention Center',
    capacity: '180 attendees',
    review_deadline: '2025-06-20',
    status: 'active',
    donors_count: 72
  },
  {
    id: 7,
    name: 'Children\'s Health Charity Dinner',
    type: 'Major Donor Event',
    date: '2025-09-05',
    location: 'Shanghai Four Seasons Hotel',
    capacity: '220 attendees',
    review_deadline: '2025-08-10',
    status: 'active',
    donors_count: 105
  },
  {
    id: 8,
    name: 'Hospital Equipment Donation Event',
    type: 'Business Event',
    date: '2025-08-18',
    location: 'Guangzhou Medical University Hospital',
    capacity: '120 attendees',
    review_deadline: '2025-07-25',
    status: 'active',
    donors_count: 55
  },
  {
    id: 9,
    name: 'Health Technology Exhibition',
    type: 'Community Event',
    date: '2025-10-20',
    location: 'Shenzhen Convention Center',
    capacity: '350 attendees',
    review_deadline: '2025-09-30',
    status: 'active',
    donors_count: 130
  },
  {
    id: 10,
    name: 'Elderly Care Initiative Launch Ceremony',
    type: 'Community Event',
    date: '2025-11-15',
    location: 'Chengdu Century City International Convention Center',
    capacity: '200 attendees',
    review_deadline: '2025-10-25',
    status: 'active',
    donors_count: 90
  }
];

// Mock donor data
export const MOCK_DONORS = [
  {
    id: 101,
    name: 'Lin Zhiming',
    first_name: 'Zhiming',
    last_name: 'Lin',
    type: 'Major Donor',
    priority: 'High',
    interests: ['Cancer Research', 'Children\'s Health'],
    flags: [],
    status: 'approved',
    previous_events: ['Spring Gala 2023', 'Charity Auction 2024'],
    relationships: 'Board Member'
  },
  {
    id: 102,
    name: 'Wang Lili',
    first_name: 'Lili',
    last_name: 'Wang',
    type: 'Corporate Donor',
    priority: 'Medium',
    interests: ['Medical Innovation'],
    flags: [],
    status: 'pending',
    previous_events: ['Corporate Partners Summit 2024'],
    relationships: 'ABC Technology Co. VP'
  },
  {
    id: 103,
    name: 'Zhang Weijian',
    first_name: 'Weijian',
    last_name: 'Zhang',
    type: 'Individual Donor',
    priority: 'Low',
    interests: ['Long-term Care', 'Medical Education'],
    flags: [],
    status: 'approved',
    previous_events: ['Research Symposium 2024'],
    relationships: ''
  },
  {
    id: 104,
    name: 'Liu Meiling',
    first_name: 'Meiling',
    last_name: 'Liu',
    type: 'Major Donor',
    priority: 'High',
    interests: ['Emergency Medical Services'],
    flags: ['Needs Attention'],
    status: 'pending',
    previous_events: ['Winter Charity Ball 2023'],
    relationships: 'Foundation Liaison'
  },
  {
    id: 105,
    name: 'Chen David',
    first_name: 'David',
    last_name: 'Chen',
    type: 'Community Donor',
    priority: 'Medium',
    interests: ['Community Health Programs', 'Elderly Care'],
    flags: [],
    status: 'approved',
    previous_events: ['Community Health Day 2024'],
    relationships: 'Community Leader'
  },
  {
    id: 106,
    name: 'Huang Zhiqiang',
    first_name: 'Zhiqiang',
    last_name: 'Huang',
    type: 'Corporate Donor',
    priority: 'High',
    interests: ['Medical Technology'],
    flags: [],
    status: 'pending',
    previous_events: ['Corporate Partners Summit 2024'],
    relationships: 'XYZ Medical Equipment Co. CEO'
  },
  {
    id: 107,
    name: 'Wu Shufang',
    first_name: 'Shufang',
    last_name: 'Wu',
    type: 'Individual Donor',
    priority: 'Low',
    interests: ['Cancer Research'],
    flags: [],
    status: 'approved',
    previous_events: [],
    relationships: ''
  },
  {
    id: 108,
    name: 'Zhao Mingming',
    first_name: 'Mingming',
    last_name: 'Zhao',
    type: 'Major Donor',
    priority: 'High',
    interests: ['Hospital Development', 'Medical Equipment'],
    flags: [],
    status: 'approved',
    previous_events: ['Spring Gala 2023', 'Winter Charity Ball 2023'],
    relationships: 'Long-term Supporter'
  },
  {
    id: 109,
    name: 'Li Xiaohong',
    first_name: 'Xiaohong',
    last_name: 'Li',
    type: 'Individual Donor',
    priority: 'Medium',
    interests: ['Children\'s Health'],
    flags: [],
    status: 'excluded',
    previous_events: [],
    auto_excluded: true,
    relationships: ''
  },
  {
    id: 110,
    name: 'Sun Jianhua',
    first_name: 'Jianhua',
    last_name: 'Sun',
    type: 'Corporate Donor',
    priority: 'High',
    interests: ['Medical Research', 'Equipment Donation'],
    flags: ['VIP'],
    status: 'approved',
    previous_events: ['Research Symposium 2023', 'Research Symposium 2024'],
    relationships: '123 Medical Group Chairman'
  }
];

// Event and donor mapping relationships
export const MOCK_EVENT_DONORS = {
  1: [101, 103, 105, 108, 110], // Spring Gala 2025
  2: [102, 104, 106, 107],      // Research Symposium 2025
  3: [103, 105, 107, 109],      // Patient Care Fundraiser
  4: [102, 106, 110],           // Corporate Partners Summit
  5: [101, 104, 108, 109, 110], // Winter Charity Ball
  6: [102, 103, 106, 108, 110], // Medical Innovation Symposium 2025
  7: [101, 104, 105, 107, 108, 109], // Children's Health Charity Dinner
  8: [102, 106, 110],           // Hospital Equipment Donation Event
  9: [101, 103, 105, 107, 109], // Health Technology Exhibition
  10: [104, 105, 107, 108]      // Elderly Care Initiative Launch Ceremony
};

// Event donor statistics data
export const MOCK_EVENT_STATS = {
  1: { pending: 0, approved: 5, excluded: 0 },
  2: { pending: 2, approved: 2, excluded: 0 },
  3: { pending: 0, approved: 3, excluded: 1 },
  4: { pending: 1, approved: 2, excluded: 0 },
  5: { pending: 1, approved: 3, excluded: 1 },
  6: { pending: 1, approved: 4, excluded: 0 },
  7: { pending: 1, approved: 4, excluded: 1 },
  8: { pending: 1, approved: 2, excluded: 0 },
  9: { pending: 0, approved: 4, excluded: 1 },
  10: { pending: 1, approved: 3, excluded: 0 }
}; 