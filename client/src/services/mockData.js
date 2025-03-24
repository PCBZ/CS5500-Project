// 临时模拟数据 - 仅用于开发

// 模拟事件数据
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
    name: '医疗创新研讨会2025',
    type: 'Scientific Event',
    date: '2025-07-12',
    location: '北京国际会议中心',
    capacity: '180 attendees',
    review_deadline: '2025-06-20',
    status: 'active',
    donors_count: 72
  },
  {
    id: 7,
    name: '儿童健康慈善晚宴',
    type: 'Major Donor Event',
    date: '2025-09-05',
    location: '上海四季酒店',
    capacity: '220 attendees',
    review_deadline: '2025-08-10',
    status: 'active',
    donors_count: 105
  },
  {
    id: 8,
    name: '医院设备捐赠活动',
    type: 'Business Event',
    date: '2025-08-18',
    location: '广州医科大学附属医院',
    capacity: '120 attendees',
    review_deadline: '2025-07-25',
    status: 'active',
    donors_count: 55
  },
  {
    id: 9,
    name: '健康科技展览会',
    type: 'Community Event',
    date: '2025-10-20',
    location: '深圳会展中心',
    capacity: '350 attendees',
    review_deadline: '2025-09-30',
    status: 'active',
    donors_count: 130
  },
  {
    id: 10,
    name: '老年健康关爱计划启动仪式',
    type: 'Community Event',
    date: '2025-11-15',
    location: '成都世纪城国际会议中心',
    capacity: '200 attendees',
    review_deadline: '2025-10-25',
    status: 'active',
    donors_count: 90
  }
];

// 模拟捐赠者数据
export const MOCK_DONORS = [
  {
    id: 101,
    name: '林志明',
    type: '主要捐赠者',
    priority: '高',
    interests: ['癌症研究', '儿童健康'],
    flags: [],
    status: 'approved',
    previous_events: ['春季晚会2023', '慈善拍卖会2024'],
    relationships: '董事会成员'
  },
  {
    id: 102,
    name: '王丽丽',
    type: '企业捐赠者',
    priority: '中',
    interests: ['医疗创新'],
    flags: [],
    status: 'pending',
    previous_events: ['企业合作伙伴峰会2024'],
    relationships: 'ABC科技公司副总裁'
  },
  {
    id: 103,
    name: '张伟健',
    type: '个人捐赠者',
    priority: '低',
    interests: ['长期护理', '医疗教育'],
    flags: [],
    status: 'approved',
    previous_events: ['研究研讨会2024'],
    relationships: ''
  },
  {
    id: 104,
    name: '刘美玲',
    type: '主要捐赠者',
    priority: '高',
    interests: ['紧急医疗服务'],
    flags: ['需关注'],
    status: 'pending',
    previous_events: ['冬季慈善舞会2023'],
    relationships: '基金会联络人'
  },
  {
    id: 105,
    name: '陈大卫',
    type: '社区捐赠者',
    priority: '中',
    interests: ['社区健康项目', '老年人关怀'],
    flags: [],
    status: 'approved',
    previous_events: ['社区健康日2024'],
    relationships: '社区领袖'
  },
  {
    id: 106,
    name: '黄志强',
    type: '企业捐赠者',
    priority: '高',
    interests: ['医疗技术'],
    flags: [],
    status: 'pending',
    previous_events: ['企业合作伙伴峰会2024'],
    relationships: 'XYZ医疗设备公司CEO'
  },
  {
    id: 107,
    name: '吴淑芳',
    type: '个人捐赠者',
    priority: '低',
    interests: ['癌症研究'],
    flags: [],
    status: 'approved',
    previous_events: [],
    relationships: ''
  },
  {
    id: 108,
    name: '赵明明',
    type: '主要捐赠者',
    priority: '高',
    interests: ['医院发展', '医疗设备'],
    flags: [],
    status: 'approved',
    previous_events: ['春季晚会2023', '冬季慈善舞会2023'],
    relationships: '长期支持者'
  },
  {
    id: 109,
    name: '李小红',
    type: '个人捐赠者',
    priority: '中',
    interests: ['儿童健康'],
    flags: [],
    status: 'excluded',
    previous_events: [],
    auto_excluded: true,
    relationships: ''
  },
  {
    id: 110,
    name: '孙建华',
    type: '企业捐赠者',
    priority: '高',
    interests: ['医疗研究', '设备捐赠'],
    flags: ['VIP'],
    status: 'approved',
    previous_events: ['研究研讨会2023', '研究研讨会2024'],
    relationships: '123医疗集团主席'
  }
];

// 事件和捐赠者映射关系
export const MOCK_EVENT_DONORS = {
  1: [101, 103, 105, 108, 110], // Spring Gala 2025
  2: [102, 104, 106, 107],      // Research Symposium 2025
  3: [103, 105, 107, 109],      // Patient Care Fundraiser
  4: [102, 106, 110],           // Corporate Partners Summit
  5: [101, 104, 108, 109, 110], // Winter Charity Ball
  6: [102, 103, 106, 108, 110], // 医疗创新研讨会2025
  7: [101, 104, 105, 107, 108, 109], // 儿童健康慈善晚宴
  8: [102, 106, 110],           // 医院设备捐赠活动
  9: [101, 103, 105, 107, 109], // 健康科技展览会
  10: [104, 105, 107, 108]      // 老年健康关爱计划启动仪式
};

// 事件捐赠者统计数据
export const MOCK_EVENT_STATS = {
  1: { pending: 0, approved: 5, excluded: 0 },
  2: { pending: 2, approved: 2, excluded: 0 },
  3: { pending: 0, approved: 3, excluded: 1 },
  4: { pending: 2, approved: 1, excluded: 0 },
  5: { pending: 1, approved: 3, excluded: 1 },
  6: { pending: 2, approved: 3, excluded: 0 },
  7: { pending: 1, approved: 4, excluded: 1 },
  8: { pending: 1, approved: 2, excluded: 0 },
  9: { pending: 0, approved: 4, excluded: 1 },
  10: { pending: 1, approved: 3, excluded: 0 }
}; 