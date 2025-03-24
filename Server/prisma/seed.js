import { PrismaClient, Role, DonorStatus, EventStatus, ReviewStatus } from '@prisma/client';
import { hashSync } from 'bcrypt';

const prisma = new PrismaClient();

// 生成随机日期（过去的1-5年内）
function randomDate(start = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000), end = new Date()) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// 生成随机金额（100-10000范围内）
function randomAmount(min = 100, max = 10000) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

// 生成随机标签
function randomTags() {
  const tags = ['VIP', '高频捐赠', '首次捐赠', '企业捐赠', '个人捐赠', '慈善基金会', '月度捐赠者', '年度捐赠者'];
  const count = Math.floor(Math.random() * 3) + 1;
  const selectedTags = [];
  
  for (let i = 0; i < count; i++) {
    const tag = tags[Math.floor(Math.random() * tags.length)];
    if (!selectedTags.includes(tag)) {
      selectedTags.push(tag);
    }
  }
  
  return selectedTags.join(',');
}

// 生成随机中文名
function randomChineseName() {
  const surnames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴', '郑', '孙'];
  const names = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞'];
  
  return surnames[Math.floor(Math.random() * surnames.length)] + names[Math.floor(Math.random() * names.length)];
}

// 生成随机组织名称
function randomOrganizationName() {
  const prefixes = ['联合', '恒信', '国泰', '宏达', '远景', '鼎盛', '华夏', '中信', '瑞丰', '金地'];
  const types = ['基金会', '集团', '企业', '公益组织', '科技有限公司', '投资有限公司'];
  
  return prefixes[Math.floor(Math.random() * prefixes.length)] + types[Math.floor(Math.random() * types.length)];
}

// 生成随机城市
function randomCity() {
  const cities = ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉', '西安', '重庆', '苏州', '天津'];
  return cities[Math.floor(Math.random() * cities.length)];
}

async function main() {
  // 清空现有数据
  console.log('清空现有数据...');
  await prisma.eventDonor.deleteMany({});
  await prisma.eventDonorList.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.donor.deleteMany({});
  await prisma.user.deleteMany({});
  
  console.log('创建用户...');
  // 创建用户
  const adminUser = await prisma.user.create({
    data: {
      name: '管理员',
      email: 'admin@example.com',
      password: hashSync('password123', 10),
      role: Role.pmm
    }
  });

  const regularUser = await prisma.user.create({
    data: {
      name: '普通用户',
      email: 'user@example.com',
      password: hashSync('password123', 10),
      role: Role.vmm
    }
  });

  console.log('创建捐赠者...');
  // 创建100个捐赠者
  const donors = [];
  for (let i = 0; i < 100; i++) {
    // 决定是个人捐赠者还是组织捐赠者
    const isOrganization = Math.random() > 0.7;
    
    let donorData = {
      excluded: Math.random() > 0.95,
      deceased: Math.random() > 0.98,
      totalDonations: randomAmount(1000, 50000),
      totalPledges: randomAmount(500, 5000),
      largestGift: randomAmount(500, 10000),
      largestGiftAppeal: ['年度筹款', '紧急救援', '教育项目', '医疗援助'][Math.floor(Math.random() * 4)],
      firstGiftDate: randomDate(new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000)),
      tags: randomTags(),
      city: randomCity()
    };
    
    // 设置最近一次捐赠的信息
    donorData.lastGiftDate = randomDate(new Date(donorData.firstGiftDate));
    donorData.lastGiftAmount = randomAmount(100, donorData.largestGift);
    donorData.lastGiftRequest = ['邮件', '电话', '活动', '社交媒体'][Math.floor(Math.random() * 4)];
    donorData.lastGiftAppeal = ['年度筹款', '紧急救援', '教育项目', '医疗援助'][Math.floor(Math.random() * 4)];
    
    // 根据是否为组织设置不同的字段
    if (isOrganization) {
      donorData.organizationName = randomOrganizationName();
    } else {
      const fullName = randomChineseName();
      donorData.firstName = fullName.substring(0, 1);
      donorData.lastName = fullName.substring(1);
      donorData.nickName = Math.random() > 0.7 ? '小' + donorData.lastName : undefined;
    }
    
    const donor = await prisma.donor.create({ data: donorData });
    donors.push(donor);
  }

  console.log('创建事件...');
  // 创建3个事件
  const events = [];
  for (let i = 0; i < 3; i++) {
    const eventDate = new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000);
    
    const event = await prisma.event.create({
      data: {
        name: `筹款活动 ${i + 1}`,
        type: ['晚宴', '音乐会', '拍卖会', '慈善跑'][i % 4],
        date: eventDate,
        location: ['北京国际会议中心', '上海世博中心', '广州大剧院', '深圳会展中心'][i % 4],
        capacity: 100 + i * 50,
        focus: ['教育', '医疗', '救灾', '环保'][i % 4],
        criteriaMinGivingLevel: 500 * (i + 1),
        timelineListGenerationDate: new Date(eventDate.getTime() - 60 * 24 * 60 * 60 * 1000),
        timelineReviewDeadline: new Date(eventDate.getTime() - 45 * 24 * 60 * 60 * 1000),
        timelineInvitationDate: new Date(eventDate.getTime() - 30 * 24 * 60 * 60 * 1000),
        status: [EventStatus.Planning, EventStatus.ListGeneration, EventStatus.Review][i % 3],
        createdBy: adminUser.id
      }
    });
    
    events.push(event);
  }

  console.log('创建捐赠者列表...');
  // 为每个事件创建一个捐赠者列表
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    
    const donorList = await prisma.eventDonorList.create({
      data: {
        eventId: event.id,
        name: `${event.name} 捐赠者列表`,
        generatedBy: adminUser.id,
      }
    });
    
    console.log(`为事件 ${event.name} 添加捐赠者...`);
    // 为每个列表添加20-30个捐赠者
    const donorCount = 20 + Math.floor(Math.random() * 10);
    const selectedDonorIds = new Set();
    
    while (selectedDonorIds.size < donorCount && selectedDonorIds.size < donors.length) {
      const randomIndex = Math.floor(Math.random() * donors.length);
      const donor = donors[randomIndex];
      
      if (!selectedDonorIds.has(donor.id)) {
        selectedDonorIds.add(donor.id);
        
        // 随机分配状态
        const status = Math.random() > 0.8 
          ? DonorStatus.Excluded 
          : (Math.random() > 0.5 ? DonorStatus.Approved : DonorStatus.Pending);
        
        // 创建EventDonor记录
        await prisma.eventDonor.create({
          data: {
            donorListId: donorList.id,
            donorId: donor.id,
            status: status,
            excludeReason: status === DonorStatus.Excluded 
              ? ['不符合条件', '已参加其他活动', '无法联系', '已婉拒'][Math.floor(Math.random() * 4)]
              : null,
            reviewerId: Math.random() > 0.7 ? adminUser.id : null,
            reviewDate: Math.random() > 0.7 ? randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) : null,
            comments: Math.random() > 0.8 
              ? ['重要捐赠者，需特别关注', '历史捐赠金额大', '首次参与活动', '需特殊座位安排'][Math.floor(Math.random() * 4)]
              : null,
            autoExcluded: Math.random() > 0.9
          }
        });
      }
    }
    
    // 更新列表的统计数据
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
  }

  console.log('测试数据创建完成!');
}

main()
  .catch(e => {
    console.error('创建测试数据时出错:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 