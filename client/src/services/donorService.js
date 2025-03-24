// Import mock data from mockData module
// import { MOCK_DONORS, MOCK_EVENT_DONORS, MOCK_EVENT_STATS } from './mockData';
import { getEventDonors } from './eventService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

/**
 * Get all donors with optional filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Results per page
 * @param {string} params.search - Search term
 * @param {string} params.eventId - Filter by event ID
 * @returns {Promise<Object>} Donor data with pagination info
 */
export const getDonors = async (params = {}) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Build URL with query parameters
    // We can now directly use snake_case parameters as the server supports them
    const url = new URL(`${API_URL}/api/donors`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        url.searchParams.append(key, params[key]);
      }
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Response is already formatted with snake_case field names
    return {
      data: data.donors || [],
      page: data.page || 1,
      limit: data.limit || 10,
      total_count: data.total || 0,
      total_pages: data.pages || 1
    };
  } catch (error) {
    console.error('Error fetching donors:', error);
    throw error; // 不再返回模拟数据，而是将错误传递给调用方
  }
};

/**
 * Get donors that are not part of a specific event
 * @param {string} eventId - Event ID to exclude donors from
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>} Available donors data
 */
export const getAvailableDonors = async (eventId, params = {}) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('获取事件ID为', eventId, '的可用捐赠者');
    
    // 步骤1: 获取所有捐赠者
    const allDonorsUrl = new URL(`${API_URL}/api/donors`);
    
    // 添加分页和搜索参数
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        allDonorsUrl.searchParams.append(key, params[key]);
      }
    });
    
    // 获取所有捐赠者列表
    console.log('获取所有捐赠者:', allDonorsUrl.toString());
    const allDonorsResponse = await fetch(allDonorsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!allDonorsResponse.ok) {
      throw new Error(`Failed to get all donors: ${allDonorsResponse.status}`);
    }
    
    const allDonorsData = await allDonorsResponse.json();
    console.log('获取到所有捐赠者:', allDonorsData.donors.length);
    
    // 步骤2: 获取事件中已存在的捐赠者ID
    let eventDonorIds = new Set();
    try {
      // 直接使用 /api/events/:id/donors 端点获取事件已有的捐赠者
      const eventDonorsUrl = new URL(`${API_URL}/api/events/${eventId}/donors?limit=1000`);
      // 添加no_sort参数，避免服务器端排序错误
      eventDonorsUrl.searchParams.set('no_sort', 'true');
      console.log('获取事件捐赠者:', eventDonorsUrl.toString());
      
      const eventDonorsResponse = await fetch(eventDonorsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (eventDonorsResponse.ok) {
        const eventDonorsData = await eventDonorsResponse.json();
        console.log('获取到事件捐赠者数据');
        
        if (eventDonorsData.donors && Array.isArray(eventDonorsData.donors)) {
          eventDonorsData.donors.forEach(donor => {
            // 处理不同的数据结构，确保我们能获取到donorId
            if (donor.donorId) eventDonorIds.add(donor.donorId);
            if (donor.donor_id) eventDonorIds.add(donor.donor_id);
            if (donor.donor && donor.donor.id) eventDonorIds.add(donor.donor.id);
          });
          console.log('事件中已有捐赠者数量:', eventDonorIds.size);
        }
      } else if (eventDonorsResponse.status === 404) {
        // 如果404，可能是列表不存在，尝试创建一个
        console.log('事件捐赠者列表可能不存在，将返回空捐赠者列表');
        // 在这里，我们不需要创建列表，因为当用户添加第一个捐赠者时会自动创建
      } else {
        console.error('获取事件捐赠者失败:', eventDonorsResponse.status);
      }
    } catch (error) {
      console.error('获取事件捐赠者时出错:', error);
      console.log('忽略错误，继续处理');
    }
    
    // 步骤3: 过滤出未添加到事件的捐赠者
    const availableDonors = allDonorsData.donors.filter(donor => {
      const donorId = donor.id;
      return !eventDonorIds.has(donorId);
    });
    
    console.log('过滤后的可用捐赠者数量:', availableDonors.length);
    
    // 返回过滤后的结果
    return {
      data: availableDonors || [],
      page: allDonorsData.page || 1,
      limit: allDonorsData.limit || 10,
      total_count: availableDonors.length,
      total_pages: Math.ceil(availableDonors.length / (allDonorsData.limit || 10))
    };
  } catch (error) {
    console.error('Error fetching available donors:', error);
    throw error; // 不再返回模拟数据，而是将错误传递给调用方
  }
};

/**
 * Add a donor to an event
 * @param {string} eventId - Event ID
 * @param {string} donorId - Donor ID
 * @returns {Promise<Object>} Response data
 */
export const addDonorToEvent = async (eventId, donorId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log(`向事件 ${eventId} 添加捐赠者 ${donorId}`);
    
    // 使用/api/events/{eventId}/donors端点添加捐赠者
    const response = await fetch(`${API_URL}/api/events/${eventId}/donors`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ donorId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('添加捐赠者失败:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('添加捐赠者成功:', result);
    return result;
  } catch (error) {
    console.error('Error adding donor to event:', error);
    throw error; // 将错误传递给调用方
  }
};

/**
 * Remove a donor from an event
 * @param {string} eventId - Event ID
 * @param {string} donorId - Donor ID
 * @returns {Promise<Object>} Response data
 */
export const removeDonorFromEvent = async (eventId, donorId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log(`从事件 ${eventId} 移除捐赠者 ${donorId}`);
    
    // 使用/api/events/{eventId}/donors/{donorId}端点移除捐赠者
    const response = await fetch(`${API_URL}/api/events/${eventId}/donors/${donorId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('移除捐赠者失败:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('移除捐赠者成功:', result);
    return result;
  } catch (error) {
    console.error('Error removing donor from event:', error);
    throw error; // 将错误传递给调用方
  }
};

/**
 * Get event-specific donor statistics
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Statistics data
 */
export const getEventDonorStats = async (eventId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/api/events/${eventId}/donor-stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching event donor statistics:', error);
    // 如果API调用失败，返回一个默认的空统计对象
    return {
      event_id: parseInt(eventId),
      total_donors: 0,
      pending_review: 0,
      approved: 0,
      excluded: 0,
      approval_rate: 0
    };
  }
}; 