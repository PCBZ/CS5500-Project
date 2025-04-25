// 测试环境的全局设置
import { jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

// 设置全局超时时间
jest.setTimeout(10000);

// 创建测试数据库连接
const prisma = new PrismaClient();

// 在测试开始前清理数据库
beforeAll(async () => {
  // 删除所有测试数据
  await prisma.eventDonor.deleteMany();
  await prisma.eventDonorList.deleteMany();
  await prisma.event.deleteMany();
  await prisma.donor.deleteMany();
  await prisma.user.deleteMany();
});

// 在测试结束后关闭数据库连接
afterAll(async () => {
  await prisma.$disconnect();
});

// 导出 prisma 实例供测试使用
export { prisma };

// 可以在这里添加其他全局测试设置 