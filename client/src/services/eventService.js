// 从mockData模块导入模拟数据
import { MOCK_EVENTS, MOCK_DONORS, MOCK_EVENT_DONORS } from './mockData';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

/**
 * Get all events with optional filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Results per page
 * @param {string} params.status - Event status filter (Planning, ListGeneration, Review, Ready, Complete)
 * @param {string} params.search - Search term
 * @returns {Promise<Object>} Event data with pagination info
 */
export const getEvents = async (params = {}) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // 创建参数副本，以便可以修改它而不影响原始对象
    const modifiedParams = { ...params };
    
    // 处理status参数
    if (modifiedParams.status === 'active') {
      // 前端使用'active'，但后端需要有效的枚举值
      modifiedParams.status = 'Ready';
    }

    // Build URL with query parameters
    const url = new URL(`${API_URL}/api/events`);
    Object.keys(modifiedParams).forEach(key => {
      if (modifiedParams[key] !== undefined && modifiedParams[key] !== '') {
        url.searchParams.append(key, modifiedParams[key]);
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

    // 获取API响应
    const responseData = await response.json();
    
    // 适配返回格式为前端期望的格式
    return {
      data: Array.isArray(responseData.events) ? responseData.events.map(event => ({
        ...event,
        // 确保字段格式一致，服务器返回的可能是下划线格式
        reviewDeadline: event.review_deadline || event.timelineReviewDeadline,
        donorsCount: event.donors_count || 0,
        // 将服务器返回的状态值映射回前端使用的状态值
        status: event.status === 'Ready' ? 'active' : event.status
      })) : [],
      page: responseData.page || 1,
      limit: responseData.limit || 10,
      total_count: responseData.total || 0,
      total_pages: responseData.pages || 1
    };

  } catch (error) {
    console.error('Error fetching events:', error);
    console.warn('Returning mock data due to API failure');
    
    // Return mock data if API call fails
    let filteredEvents = [...MOCK_EVENTS];
    
    // Filter by status if provided
    if (params.status) {
      // 将前端使用的'active'映射到适当的模拟数据状态
      if (params.status === 'active' || params.status === 'Ready') {
        filteredEvents = filteredEvents.filter(event => 
          event.status === 'active' || 
          event.status === 'Ready' ||
          event.status === 'Planning' || 
          event.status === 'ListGeneration' ||
          event.status === 'Review'
        );
      } else {
        // 直接按提供的状态过滤
        filteredEvents = filteredEvents.filter(event => event.status === params.status);
      }
    }
    
    // Filter by search term if provided
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredEvents = filteredEvents.filter(event => 
        event.name.toLowerCase().includes(searchLower) || 
        event.type.toLowerCase().includes(searchLower) ||
        event.location.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEvents = filteredEvents.slice(startIndex, endIndex);
    
    return {
      data: paginatedEvents,
      page: parseInt(page),
      limit: parseInt(limit),
      total_count: filteredEvents.length,
      total_pages: Math.ceil(filteredEvents.length / limit)
    };
  }
};

/**
 * Get a specific event by ID
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Event data
 */
export const getEventById = async (eventId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/api/events/${eventId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 获取API响应并直接返回，保持数据格式一致
    const responseData = await response.json();
    
    // 适配返回格式
    const eventData = responseData.event || responseData;
    
    return { 
      data: {
        ...eventData,
        // 确保字段格式一致
        reviewDeadline: eventData.review_deadline || eventData.timelineReviewDeadline,
        donorsCount: eventData.donors_count || 0,
        // 将服务器返回的状态值映射回前端使用的状态值
        status: eventData.status === 'Ready' ? 'active' : eventData.status
      }
    };
  } catch (error) {
    console.error(`Error fetching event ${eventId}:`, error);
    console.warn('Returning mock data due to API failure');
    
    // Return mock event if API call fails
    const mockEvent = MOCK_EVENTS.find(event => event.id === parseInt(eventId));
    if (!mockEvent) {
      throw new Error(`Event with ID ${eventId} not found`);
    }
    
    return { data: mockEvent };
  }
};

/**
 * Get donors for a specific event
 * @param {string} eventId - Event ID
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Results per page
 * @param {string} params.status - Donor status filter (approved, pending, excluded)
 * @param {string} params.search - Search term
 * @returns {Promise<Object>} Donor data with pagination info
 */
export const getEventDonors = async (eventId, params = {}) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Build URL with query parameters
    const url = new URL(`${API_URL}/api/events/${eventId}/donors`);
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

    // 获取API响应
    const responseData = await response.json();
    
    // 适配返回格式为前端期望的格式
    return {
      data: Array.isArray(responseData.donors) ? responseData.donors.map(donor => ({
        ...donor,
        // 确保字段格式一致，转换下划线格式为驼峰格式
        firstName: donor.first_name || donor.firstName,
        lastName: donor.last_name || donor.lastName,
        nickName: donor.nick_name || donor.nickName,
        organizationName: donor.organization_name || donor.organizationName,
        totalDonations: donor.total_donations || donor.totalDonations || 0,
        largestGift: donor.largest_gift || donor.largestGift || 0,
        firstGiftDate: donor.first_gift_date || donor.firstGiftDate,
        lastGiftDate: donor.last_gift_date || donor.lastGiftDate,
        lastGiftAmount: donor.last_gift_amount || donor.lastGiftAmount || 0,
        // 构建完整名称供显示
        name: `${donor.first_name || donor.firstName || ''} ${donor.last_name || donor.lastName || ''}`.trim() || donor.organization_name || donor.organizationName || '未命名'
      })) : [],
      page: responseData.page || 1,
      limit: responseData.limit || 10,
      total_count: responseData.total || 0,
      total_pages: responseData.pages || 1
    };
  } catch (error) {
    console.error(`Error fetching donors for event ${eventId}:`, error);
    console.warn('Returning mock data due to API failure');
    
    // Return mock data if API call fails
    // Get mock donors for this event
    let eventDonorIds = MOCK_EVENT_DONORS[eventId] || [];
    let filteredDonors = MOCK_DONORS.filter(donor => eventDonorIds.includes(donor.id));
    
    // Filter by status if provided
    if (params.status) {
      filteredDonors = filteredDonors.filter(donor => donor.status === params.status);
    }
    
    // Filter by search term if provided
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredDonors = filteredDonors.filter(donor => 
        donor.name.toLowerCase().includes(searchLower) || 
        donor.type.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDonors = filteredDonors.slice(startIndex, endIndex);
    
    return {
      data: paginatedDonors,
      page: parseInt(page),
      limit: parseInt(limit),
      total_count: filteredDonors.length,
      total_pages: Math.ceil(filteredDonors.length / limit)
    };
  }
}; 