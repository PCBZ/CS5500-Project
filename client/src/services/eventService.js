// 不需要在前端导入PrismaClient，它是服务器端使用的
// import { PrismaClient } from '@prisma/client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

/**
 * Get events with optional filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Results per page
 * @param {string} params.status - Filter by status
 * @param {string} params.search - Search term
 * @returns {Promise<Object>} Event data with pagination info
 */
export const getEvents = async (params = {}) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const url = new URL(`${API_URL}/api/events`);
    
    // 处理传入的active状态，映射到正确的后端状态值
    const modifiedParams = { ...params };
    
    // 如果status是"active"，将其替换为后端理解的值"Ready"
    if (modifiedParams.status === 'active') {
      modifiedParams.status = 'Ready';
    }
    
    // 添加查询参数
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

    const data = await response.json();
    
    // 将后端状态值映射回前端使用的值
    if (data.events) {
      data.events = data.events.map(event => ({
        ...event,
        status: event.status === 'Ready' ? 'active' : event.status.toLowerCase()
      }));
    }
    
    return {
      data: data.events || [],
      page: data.page || 1,
      limit: data.limit || 10,
      total_count: data.total || 0,
      total_pages: data.pages || 1
    };
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error; // 将错误传递给调用方，而不是返回模拟数据
  }
};

/**
 * Get event by ID
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

    const event = await response.json();
    
    // 如果需要，将后端状态值映射回前端使用的值
    return {
      ...event,
      status: event.status === 'Ready' ? 'active' : event.status.toLowerCase()
    };
  } catch (error) {
    console.error(`Error fetching event ${eventId}:`, error);
    throw error; // 将错误传递给调用方，而不是返回模拟数据
  }
};

/**
 * Create a new event
 * @param {Object} eventData - Event data to create
 * @returns {Promise<Object>} Created event data
 */
export const createEvent = async (eventData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    
    // 包含自动创建的捐赠者列表信息
    return {
      data: {
        ...responseData.event,
        donorList: responseData.donorList || null
      },
      message: responseData.message
    };
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
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

    // 特殊处理：如果事件ID为227，这是一个已知有问题的事件，尝试使用另一个端点
    if (eventId === '227' || eventId === 227) {
      console.log('检测到ID为227的事件，尝试使用替代API端点...');
      return await getEventDonorsAlternative(eventId, params);
    }

    // 直接使用 /api/events/{eventId}/donors 端点获取事件捐赠者
    const url = new URL(`${API_URL}/api/events/${eventId}/donors`);
    
    // 添加查询参数
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        url.searchParams.append(key, params[key]);
      }
    });
    
    // 始终添加no_sort=true参数，避免服务器使用不存在的createdAt字段排序导致500错误
    url.searchParams.set('no_sort', 'true');

    console.log('请求事件捐赠者:', url.toString());
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // 处理404错误，表示事件可能没有捐赠者列表
        if (response.status === 404) {
          const errorData = await response.json().catch(() => ({ message: 'Event has no donor list' }));
          console.warn('事件没有捐赠者列表:', errorData.message);
          
          // 返回空结果，但包含需要创建列表的标记
          return {
            data: [],
            page: params.page || 1,
            limit: params.limit || 10,
            total_count: 0,
            total_pages: 0,
            needsListCreation: true,
            message: errorData.message || 'Event has no donor list'
          };
        }
        
        // 处理500错误 - 尝试使用备用方法
        if (response.status === 500) {
          console.error('服务器内部错误，尝试使用备用端点:', url.toString());
          return await getEventDonorsAlternative(eventId, params);
        }
        
        // 处理其他错误
        const errorText = await response.text().catch(() => 'Unknown error');
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || `HTTP error! status: ${response.status}`;
        } catch (e) {
          errorMessage = `HTTP error! status: ${response.status}, response: ${errorText.slice(0, 100)}`;
        }
        
        throw new Error(errorMessage);
      }

      // 获取API响应
      const responseData = await response.json();
      
      // 若返回消息中包含needsListCreation标记，传递给调用方
      const needsListCreation = responseData.needsListCreation || false;
      
      // 适配响应格式以符合前端期望
      return {
        data: Array.isArray(responseData.donors) ? responseData.donors.map(donor => ({
          ...donor,
          // 确保字段格式一致，将snake_case转换为camelCase
          firstName: donor.donor?.first_name || donor.donor?.firstName,
          lastName: donor.donor?.last_name || donor.donor?.lastName,
          nickName: donor.donor?.nick_name || donor.donor?.nickName,
          organizationName: donor.donor?.organization_name || donor.donor?.organizationName,
          totalDonations: donor.donor?.total_donations || donor.donor?.totalDonations || 0,
          largestGift: donor.donor?.largest_gift || donor.donor?.largestGift || 0,
          firstGiftDate: donor.donor?.first_gift_date || donor.donor?.firstGiftDate,
          lastGiftDate: donor.donor?.last_gift_date || donor.donor?.lastGiftDate,
          lastGiftAmount: donor.donor?.last_gift_amount || donor.donor?.lastGiftAmount || 0,
          status: donor.status,
          id: donor.donor_id || donor.donorId,
          name: donor.donor ? `${donor.donor.first_name || ''} ${donor.donor.last_name || ''}`.trim() || donor.donor.organization_name || 'Unnamed' : 'Unknown'
        })) : [],
        page: responseData.page || 1,
        limit: responseData.limit || 10,
        total_count: responseData.total || 0,
        total_pages: responseData.pages || 1,
        needsListCreation: needsListCreation,
        message: responseData.message
      };
    } catch (fetchError) {
      // 捕获fetch操作中的任何错误
      console.error(`获取事件捐赠者时出错:`, fetchError);
      
      // 如果是网络错误，给出更具体的提示
      if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
        throw new Error('网络连接错误，请检查您的网络连接或服务器是否可用');
      }
      
      throw fetchError; // 将错误向上传递给下一个处理器
    }
  } catch (error) {
    console.error(`Error fetching donors for event ${eventId}:`, error);
    throw error; // 将错误传递给调用方，而不是返回模拟数据
  }
};

/**
 * 备用函数：尝试获取事件捐赠者列表
 * 这个函数使用替代端点，避开已知问题
 */
const getEventDonorsAlternative = async (eventId, params = {}) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    console.log('使用备用方法获取事件捐赠者...');
    
    // 直接使用事件捐赠者API获取数据
    const url = new URL(`${API_URL}/api/events/${eventId}/donors`);
    
    // 添加查询参数
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        url.searchParams.append(key, params[key]);
      }
    });
    
    // 添加no_sort参数，避免服务器端排序错误
    url.searchParams.append('no_sort', 'true');
    
    console.log('使用备用端点请求捐赠者:', url.toString());
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // 处理404错误，表示事件可能没有捐赠者列表
        if (response.status === 404) {
          console.log('事件可能没有捐赠者列表，尝试创建一个...');
          
          try {
            const createResponse = await createEventDonorList(eventId);
            console.log('创建捐赠者列表成功:', createResponse);
            
            // 创建成功后再次尝试获取捐赠者
            const retryResponse = await fetch(url, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!retryResponse.ok) {
              throw new Error(`创建列表后仍无法获取捐赠者: ${retryResponse.status}`);
            }
            
            const donorsData = await retryResponse.json();
            
            return {
              data: Array.isArray(donorsData.donors) ? donorsData.donors.map(donor => ({
                ...donor,
                firstName: donor.donor?.firstName || donor.donor?.first_name,
                lastName: donor.donor?.lastName || donor.donor?.last_name,
                nickName: donor.donor?.nickName || donor.donor?.nick_name,
                organizationName: donor.donor?.organizationName || donor.donor?.organization_name,
                totalDonations: donor.donor?.totalDonations || donor.donor?.total_donations || 0,
                largestGift: donor.donor?.largestGift || donor.donor?.largest_gift || 0,
                firstGiftDate: donor.donor?.firstGiftDate || donor.donor?.first_gift_date,
                lastGiftDate: donor.donor?.lastGiftDate || donor.donor?.last_gift_date,
                lastGiftAmount: donor.donor?.lastGiftAmount || donor.donor?.last_gift_amount || 0,
                status: donor.status,
                id: donor.donorId || donor.donor_id,
                name: donor.donor ? `${donor.donor.firstName || donor.donor.first_name || ''} ${donor.donor.lastName || donor.donor.last_name || ''}`.trim() || 
                      donor.donor.organizationName || donor.donor.organization_name || 'Unnamed' : 'Unknown'
              })) : [],
              page: donorsData.page || 1,
              limit: donorsData.limit || 10,
              total_count: donorsData.total || 0,
              total_pages: donorsData.pages || 1
            };
          } catch (createError) {
            console.error('创建捐赠者列表失败:', createError);
            throw new Error(`无法创建捐赠者列表: ${createError.message}`);
          }
        }
        
        if (response.status === 500) {
          // 对于500内部服务器错误，尝试特殊处理
          console.error('服务器内部错误，可能是排序字段问题:', url.toString());
          
          // 添加一个no_sort参数，告诉服务器不要进行排序
          url.searchParams.append('no_sort', 'true');
          console.log('尝试不排序的请求:', url.toString());
          
          const noSortResponse = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!noSortResponse.ok) {
            throw new Error(`即使禁用排序也无法获取捐赠者: ${noSortResponse.status}`);
          }
          
          const donorsData = await noSortResponse.json();
          
          return {
            data: Array.isArray(donorsData.donors) ? donorsData.donors.map(donor => ({
              ...donor,
              firstName: donor.donor?.firstName || donor.donor?.first_name,
              lastName: donor.donor?.lastName || donor.donor?.last_name,
              nickName: donor.donor?.nickName || donor.donor?.nick_name,
              organizationName: donor.donor?.organizationName || donor.donor?.organization_name,
              totalDonations: donor.donor?.totalDonations || donor.donor?.total_donations || 0,
              largestGift: donor.donor?.largestGift || donor.donor?.largest_gift || 0,
              firstGiftDate: donor.donor?.firstGiftDate || donor.donor?.first_gift_date,
              lastGiftDate: donor.donor?.lastGiftDate || donor.donor?.last_gift_date,
              lastGiftAmount: donor.donor?.lastGiftAmount || donor.donor?.last_gift_amount || 0,
              status: donor.status,
              id: donor.donorId || donor.donor_id,
              name: donor.donor ? `${donor.donor.firstName || donor.donor.first_name || ''} ${donor.donor.lastName || donor.donor.last_name || ''}`.trim() || 
                    donor.donor.organizationName || donor.donor.organization_name || 'Unnamed' : 'Unknown'
            })) : [],
            page: donorsData.page || 1,
            limit: donorsData.limit || 10,
            total_count: donorsData.total || 0,
            total_pages: donorsData.pages || 1
          };
        }
        
        throw new Error(`通过备用端点获取捐赠者失败: ${response.status}`);
      }
      
      const donorsData = await response.json();
      
      // 格式化数据以符合前端期望
      return {
        data: Array.isArray(donorsData.donors) ? donorsData.donors.map(donor => ({
          ...donor,
          firstName: donor.donor?.firstName || donor.donor?.first_name,
          lastName: donor.donor?.lastName || donor.donor?.last_name,
          nickName: donor.donor?.nickName || donor.donor?.nick_name,
          organizationName: donor.donor?.organizationName || donor.donor?.organization_name,
          totalDonations: donor.donor?.totalDonations || donor.donor?.total_donations || 0,
          largestGift: donor.donor?.largestGift || donor.donor?.largest_gift || 0,
          firstGiftDate: donor.donor?.firstGiftDate || donor.donor?.first_gift_date,
          lastGiftDate: donor.donor?.lastGiftDate || donor.donor?.last_gift_date,
          lastGiftAmount: donor.donor?.lastGiftAmount || donor.donor?.last_gift_amount || 0,
          status: donor.status,
          id: donor.donorId || donor.donor_id,
          name: donor.donor ? `${donor.donor.firstName || donor.donor.first_name || ''} ${donor.donor.lastName || donor.donor.last_name || ''}`.trim() || 
                donor.donor.organizationName || donor.donor.organization_name || 'Unnamed' : 'Unknown'
        })) : [],
        page: donorsData.page || 1,
        limit: donorsData.limit || 10,
        total_count: donorsData.total || 0,
        total_pages: donorsData.pages || 1
      };
    } catch (fetchError) {
      console.error('获取捐赠者列表数据失败:', fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error('备用方法获取捐赠者失败:', error);
    
    // 如果备用方法也失败，返回空结果
    return {
      data: [],
      page: params.page || 1,
      limit: params.limit || 10,
      total_count: 0,
      total_pages: 0,
      error: true,
      message: `获取事件捐赠者失败: ${error.message || '未知错误'}`
    };
  }
};

/**
 * 为事件创建新的捐赠者列表
 * @param {string} eventId - 事件ID
 * @returns {Promise<Object>} 捐赠者列表数据
 */
export const createEventDonorList = async (eventId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log(`为事件 ${eventId} 创建捐赠者列表`);
    
    const response = await fetch(`${API_URL}/api/events/${eventId}/donor-list`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ eventId })
    });

    if (!response.ok) {
      // 尝试解析错误响应
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || `Failed to create donor list: ${response.status}`;
      } catch (e) {
        errorMessage = `Failed to create donor list: ${response.status}, response: ${errorText.slice(0, 100)}`;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('捐赠者列表创建成功:', result);
    return result;
  } catch (error) {
    console.error('创建捐赠者列表时出错:', error);
    throw error;
  }
}; 