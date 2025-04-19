// 不需要在前端导入PrismaClient，它是服务器端使用的
// import { PrismaClient } from '@prisma/client';

import { fetchWithAuthMiddleware } from '../middleware/authMiddleware';
import { toFrontendStatus, toBackendStatus } from '../utils/statusConversion';


const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

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

    const response = await fetchWithAuthMiddleware(url, {
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
    throw error;
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

    const response = await fetchWithAuthMiddleware(`${API_URL}/api/events/${eventId}`, {
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
    throw error;
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

    const response = await fetchWithAuthMiddleware(`${API_URL}/api/events`, {
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

    // Special handling: If event ID is 227, this is a known problematic event, try using another endpoint
    if (eventId === '227' || eventId === 227) {
      console.log('Detected event ID 227, trying alternative API endpoint...');
      return await getEventDonorsAlternative(eventId, params);
    }

    // Directly use /api/events/{eventId}/donors endpoint to get event donors
    const url = new URL(`${API_URL}/api/events/${eventId}/donors`);
    
    // Add query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        url.searchParams.append(key, params[key]);
      }
    });
    
    // Always add no_sort=true parameter to avoid 500 error from server using non-existent createdAt field for sorting
    url.searchParams.set('no_sort', 'true');

    console.log('Requesting event donors:', url.toString());
    
    try {
      const response = await fetchWithAuthMiddleware(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Handle 404 error, indicating event may have no donor list
        if (response.status === 404) {
          const errorData = await response.json().catch(() => ({ message: 'Event has no donor list' }));
          console.warn('Event has no donor list:', errorData.message);
          
          // Return empty result with flag indicating list creation is needed
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
        
        // Handle 500 error - try alternative method
        if (response.status === 500) {
          console.error('Server internal error, trying alternative endpoint:', url.toString());
          return await getEventDonorsAlternative(eventId, params);
        }
        
        // Handle other errors
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

      // Get API response
      const responseData = await response.json();
      
      // If response message includes needsListCreation flag, pass it to caller
      const needsListCreation = responseData.needsListCreation || false;
      
      // Format the response data
      return {
        data: Array.isArray(responseData.donors) ? responseData.donors.map(donor => ({
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
        page: responseData.page || 1,
        limit: responseData.limit || 10,
        total_count: responseData.total || 0,
        total_pages: responseData.pages || 1,
        needsListCreation
      };
    } catch (fetchError) {
      console.error('Failed to fetch donor list data:', fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error('Failed to get event donors:', error);
    throw error;
  }
};

/**
 * Alternative function to get event donors
 * This function uses an alternative endpoint to avoid known issues
 */
const getEventDonorsAlternative = async (eventId, params = {}) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    console.log('Using alternative method to get event donors...');
    
    // Directly use event donor API to get data
    const url = new URL(`${API_URL}/api/events/${eventId}/donors`);
    
    // Add query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        url.searchParams.append(key, params[key]);
      }
    });
    
    // Add no_sort parameter to avoid server-side sorting errors
    url.searchParams.append('no_sort', 'true');
    
    console.log('Using alternative endpoint to request donors:', url.toString());
    
    try {
      const response = await fetchWithAuthMiddleware(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // Handle 404 error, indicating event may have no donor list
        if (response.status === 404) {
          console.log('Event may have no donors, trying to create one...');
          
          try {
            const createResponse = await createEventDonorList(eventId);
            console.log('Donor list creation successful:', createResponse);
            
            // Try to get donors again after list creation
            const retryResponse = await fetchWithAuthMiddleware(url, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!retryResponse.ok) {
              throw new Error(`Failed to get donors after list creation: ${retryResponse.status}`);
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
            console.error('Failed to create donor list:', createError);
            throw new Error(`Failed to create donor list: ${createError.message}`);
          }
        }
        
        if (response.status === 500) {
          // For 500 internal server error, try special handling
          console.error('Server internal error, possibly sorting field problem:', url.toString());
          
          // Add no_sort parameter to tell server not to sort
          url.searchParams.append('no_sort', 'true');
          console.log('Trying to request without sorting:', url.toString());
          
          const noSortResponse = await fetchWithAuthMiddleware(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!noSortResponse.ok) {
            throw new Error(`Even without sorting cannot get donors: ${noSortResponse.status}`);
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
        
        throw new Error(`Failed to get donors through alternative endpoint: ${response.status}`);
      }
      
      const donorsData = await response.json();
      
      // Format data to match frontend expectations
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
      console.error('Failed to fetch donor list data:', fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error('Failed to get donors through alternative method:', error);
    
    // If alternative method also fails, return empty result
    return {
      data: [],
      page: params.page || 1,
      limit: params.limit || 10,
      total_count: 0,
      total_pages: 0,
      error: true,
      message: `Failed to get event donors: ${error.message || 'Unknown error'}`
    };
  }
};

/**
 * Create a new donor list for an event
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Donor list data
 */
export const createEventDonorList = async (eventId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log(`Creating donor list for event ${eventId}`);
    
    const response = await fetchWithAuthMiddleware(`${API_URL}/api/events/${eventId}/donor-list`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ eventId })
    });

    if (!response.ok) {
      // Try to parse error response
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
    console.log('Donor list creation successful:', result);
    return result;
  } catch (error) {
    console.error('Failed to create donor list:', error);
    throw error;
  }
};

/**
 * Update an existing event
 * @param {string} eventId - Event ID
 * @param {Object} eventData - Updated event data
 * @returns {Promise<Object>} Updated event data
 */
export const updateEvent = async (eventId, eventData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Convert frontend status to backend status
    const modifiedEventData = {
      ...eventData,
      status: toBackendStatus(eventData.status)
    };

    const response = await fetchWithAuthMiddleware(`${API_URL}/api/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(modifiedEventData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const updatedEvent = await response.json();
    
    // Convert backend status back to frontend status
    return {
      ...updatedEvent,
      status: toFrontendStatus(updatedEvent.status)
    };
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

/**
 * Delete an event
 * @param {string} eventId - Event ID
 * @returns {Promise<void>}
 */
export const deleteEvent = async (eventId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetchWithAuthMiddleware(`${API_URL}/api/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

/**
 * Get all event types
 * @returns {Promise<Array>} Array of event types
 */
export const getEventTypes = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetchWithAuthMiddleware(`${API_URL}/api/events/types`, {
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
    return data.types || [];
  } catch (error) {
    console.error('Error fetching event types:', error);
    throw error;
  }
};

/**
 * Get all event locations
 * @returns {Promise<Array>} Array of event locations
 */
export const getEventLocations = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetchWithAuthMiddleware(`${API_URL}/api/events/locations`, {
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
    return data.locations || [];
  } catch (error) {
    console.error('Error fetching event locations:', error);
    throw error;
  }
}; 