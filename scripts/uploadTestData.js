#!/usr/bin/env node

/**
 * 通过HTTP API上传测试数据
 * 用法: node uploadTestData.js <data_file_path>
 * 示例: node uploadTestData.js ./bcEventsWithCity.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// 获取目录名
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API基础URL
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

/**
 * 登录获取认证令牌
 * @returns {Promise<string>} 认证令牌
 */
async function login() {
  try {
    console.log('登录中获取认证令牌...');
    const response = await fetch(`${API_BASE_URL}/api/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'tom@example.com',
        password: 'password123'
      })
    });

    if (!response.ok) {
      throw new Error(`登录失败: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.token) {
      throw new Error('登录响应中没有找到令牌');
    }

    console.log('✓ 认证令牌获取成功');
    return data.token;
  } catch (error) {
    console.error('登录获取令牌失败:', error.message);
    throw error;
  }
}

/**
 * 上传事件数据
 * @param {Array} events 事件数据
 * @param {string} token 认证令牌
 * @returns {Promise<Array>} 上传成功的事件ID映射
 */
async function uploadEvents(events, token) {
  console.log(`上传 ${events.length} 个事件...`);
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
        throw new Error(`API响应错误: ${response.statusText}`);
      }

      const createdEvent = await response.json();
      uploadedEvents.push({
        originalId: event.id,
        newId: createdEvent.id
      });

      console.log(`  ✓ 事件 "${event.name}" (ID: ${createdEvent.id}) 上传成功`);
    } catch (error) {
      console.error(`  ✗ 上传事件 "${event.name}" 失败:`, error.message);
    }
  }

  return uploadedEvents;
}

/**
 * 上传捐赠者数据
 * @param {Array} donors 捐赠者数据
 * @param {string} token 认证令牌
 * @returns {Promise<Array>} 上传成功的捐赠者ID映射
 */
async function uploadDonors(donors, token) {
  console.log(`上传 ${donors.length} 位捐赠者...`);
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
          pmm: donor.pmm,
          excluded: !!donor.excluded,
          deceased: !!donor.deceased,
          firstName: donor.firstName,
          lastName: donor.lastName,
          organizationName: donor.organizationName,
          totalDonations: parseFloat(donor.totalDonations || 0),
          largestGift: parseFloat(donor.largestGift || 0),
          firstGiftDate: donor.firstGiftDate,
          lastGiftDate: donor.lastGiftDate,
          lastGiftAmount: parseFloat(donor.lastGiftAmount || 0),
          city: donor.city,
          tags: donor.tags,
          type: donor.type,
          priority: donor.priority
        })
      });

      if (!response.ok) {
        throw new Error(`API响应错误: ${response.statusText}`);
      }

      const createdDonor = await response.json();
      uploadedDonors.push({
        originalId: donor.id,
        newId: createdDonor.id
      });

      // 每上传100条记录输出一次进度
      if (uploadedDonors.length % 10 === 0) {
        console.log(`  已上传 ${uploadedDonors.length} 位捐赠者...`);
      }
    } catch (error) {
      console.error(`  ✗ 上传捐赠者 (ID: ${donor.id}) 失败:`, error.message);
    }
  }

  console.log(`  ✓ 总共上传 ${uploadedDonors.length} 位捐赠者`);
  return uploadedDonors;
}

/**
 * 创建事件-捐赠者关联关系
 * @param {Array} eventMapping 事件ID映射
 * @param {Array} donorMapping 捐赠者ID映射
 * @param {Object} eventDonors 事件-捐赠者关系
 * @param {string} token 认证令牌
 */
async function createEventDonorRelationships(eventMapping, donorMapping, eventDonors, token) {
  console.log('创建事件-捐赠者关联关系...');

  for (const eventMap of eventMapping) {
    const originalEventId = eventMap.originalId;
    const newEventId = eventMap.newId;

    if (!eventDonors[originalEventId] || eventDonors[originalEventId].length === 0) {
      console.log(`  事件ID ${newEventId} 没有关联的捐赠者，跳过`);
      continue;
    }

    try {
      // 对每个关联的捐赠者，添加到事件中
      let addedDonors = 0;
      for (const originalDonorId of eventDonors[originalEventId]) {
        // 查找新的捐赠者ID
        const donorMap = donorMapping.find(d => d.originalId === originalDonorId);

        if (donorMap) {
          const response = await fetch(`${API_BASE_URL}/api/events/${newEventId}/donors/${donorMap.newId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              status: Math.random() < 0.7 ? 'Approved' : (Math.random() < 0.5 ? 'Pending' : 'Excluded')
            })
          });

          if (response.ok) {
            addedDonors++;
          }
        }
      }

      console.log(`  ✓ 已将 ${addedDonors} 位捐赠者关联到事件ID ${newEventId}`);
    } catch (error) {
      console.error(`  ✗ 为事件ID ${newEventId} 创建捐赠者关联时出错:`, error.message);
    }
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    // 获取命令行参数
    const dataFilePath = process.argv[2];

    if (!dataFilePath) {
      console.error('错误: 请提供测试数据文件路径');
      console.error('用法: node uploadTestData.js <data_file_path>');
      process.exit(1);
    }

    // 读取数据文件
    const fullPath = path.resolve(process.cwd(), dataFilePath);

    if (!fs.existsSync(fullPath)) {
      console.error(`错误: 文件 ${fullPath} 不存在`);
      process.exit(1);
    }

    console.log(`从 ${fullPath} 读取测试数据...`);
    const jsonData = fs.readFileSync(fullPath, 'utf8');
    const testData = JSON.parse(jsonData);

    // 验证数据结构
    if (!testData.MOCK_EVENTS || !testData.MOCK_DONORS) {
      console.error('错误: 数据文件格式不正确，缺少必需的数据部分');
      process.exit(1);
    }

    // 获取认证令牌
    const token = await login();

    console.log('开始上传测试数据...');

    // 1. 上传事件
    const eventMapping = await uploadEvents(testData.MOCK_EVENTS, token);

    // 2. 上传捐赠者
    const donorMapping = await uploadDonors(testData.MOCK_DONORS, token);

    // 3. 创建事件-捐赠者关联关系
    if (testData.MOCK_EVENT_DONORS) {
      await createEventDonorRelationships(
        eventMapping,
        donorMapping,
        testData.MOCK_EVENT_DONORS,
        token
      );
    }

    console.log('测试数据上传完成!');

  } catch (error) {
    console.error('上传数据时出错:', error);
    process.exit(1);
  }
}

// 执行主函数
main(); 