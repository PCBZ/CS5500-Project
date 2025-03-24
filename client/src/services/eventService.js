// Import mock data from mockData module
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

    // Create a copy of params to modify without affecting original object
    const modifiedParams = { ...params };
    
    // Handle status parameter
    if (modifiedParams.status === 'active') {
      // Frontend uses 'active', but backend needs valid enum value
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

    // Get API response
    const responseData = await response.json();
    
    // Adapt response format to frontend expectations
    return {
      data: Array.isArray(responseData.events) ? responseData.events.map(event => ({
        ...event,
        // Ensure consistent field formats, server might return snake_case
        reviewDeadline: event.review_deadline || event.timelineReviewDeadline,
        donorsCount: event.donors_count || 0,
        // Map server status values back to frontend status values
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
      // Map frontend 'active' to appropriate mock data status
      if (params.status === 'active' || params.status === 'Ready') {
        filteredEvents = filteredEvents.filter(event => 
          event.status === 'active' || 
          event.status === 'Ready' ||
          event.status === 'Planning' || 
          event.status === 'ListGeneration' ||
          event.status === 'Review'
        );
      } else {
        // Filter directly by provided status
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

    // Get API response and return directly, maintaining consistent data format
    const responseData = await response.json();
    
    // Adapt response format
    const eventData = responseData.event || responseData;
    
    return { 
      data: {
        ...eventData,
        // Ensure consistent field formats
        reviewDeadline: eventData.review_deadline || eventData.timelineReviewDeadline,
        donorsCount: eventData.donors_count || 0,
        // Map server status values back to frontend status values
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

    // Get API response
    const responseData = await response.json();
    
    // Adapt response format to frontend expectations
    return {
      data: Array.isArray(responseData.donors) ? responseData.donors.map(donor => ({
        ...donor,
        // Ensure consistent field formats, convert snake_case to camelCase
        firstName: donor.first_name || donor.firstName,
        lastName: donor.last_name || donor.lastName,
        nickName: donor.nick_name || donor.nickName,
        organizationName: donor.organization_name || donor.organizationName,
        totalDonations: donor.total_donations || donor.totalDonations || 0,
        largestGift: donor.largest_gift || donor.largestGift || 0,
        firstGiftDate: donor.first_gift_date || donor.firstGiftDate,
        lastGiftDate: donor.last_gift_date || donor.lastGiftDate,
        lastGiftAmount: donor.last_gift_amount || donor.lastGiftAmount || 0,
        // Build full name for display
        name: `${donor.first_name || donor.firstName || ''} ${donor.last_name || donor.lastName || ''}`.trim() || donor.organization_name || donor.organizationName || 'Unnamed'
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