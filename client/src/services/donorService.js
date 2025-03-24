// Import mock data from mockData module
import { MOCK_DONORS, MOCK_EVENT_DONORS, MOCK_EVENT_STATS } from './mockData';

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
    console.warn('Returning mock data due to API failure');
    
    // Return mock data if API call fails
    let filteredDonors = [...MOCK_DONORS];
    
    // Filter by event id if provided
    if (params.eventId) {
      const eventDonorIds = MOCK_EVENT_DONORS[params.eventId] || [];
      filteredDonors = filteredDonors.filter(donor => eventDonorIds.includes(donor.id));
    }
    
    // Filter by search term if provided
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredDonors = filteredDonors.filter(donor => 
        (donor.first_name + ' ' + donor.last_name).toLowerCase().includes(searchLower) || 
        (donor.organization_name || '').toLowerCase().includes(searchLower) ||
        (donor.type || '').toLowerCase().includes(searchLower)
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

    // Directly get available donors from API, using not_in_event parameter
    const availableDonorsUrl = new URL(`${API_URL}/api/donors`);
    // Add not_in_event parameter
    availableDonorsUrl.searchParams.append('not_in_event', eventId);
    
    // Add other parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        availableDonorsUrl.searchParams.append(key, params[key]);
      }
    });
    
    const response = await fetch(availableDonorsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get available donors: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Return formatted response
    return {
      data: data.donors || [],
      page: data.page || 1,
      limit: data.limit || 10,
      total_count: data.total || 0,
      total_pages: data.pages || 1
    };
  } catch (error) {
    console.error('Error fetching available donors:', error);
    console.warn('Returning mock data due to API failure');
    
    // Return mock data for available donors (donors not in this event)
    const eventDonorIds = MOCK_EVENT_DONORS[eventId] || [];
    const availableDonors = MOCK_DONORS.filter(donor => !eventDonorIds.includes(donor.id));
    
    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDonors = availableDonors.slice(startIndex, endIndex);
    
    return {
      data: paginatedDonors,
      page: parseInt(page),
      limit: parseInt(limit),
      total_count: availableDonors.length,
      total_pages: Math.ceil(availableDonors.length / limit)
    };
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

    const response = await fetch(`${API_URL}/api/events/${eventId}/donors`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ donorId })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding donor to event:', error);
    console.warn('Using mock data due to API failure');
    
    // Update mock data
    if (!MOCK_EVENT_DONORS[eventId]) {
      MOCK_EVENT_DONORS[eventId] = [];
    }
    
    // Check if donor already exists in event
    if (!MOCK_EVENT_DONORS[eventId].includes(parseInt(donorId))) {
      MOCK_EVENT_DONORS[eventId].push(parseInt(donorId));
      
      // Update stats
      if (!MOCK_EVENT_STATS[eventId]) {
        MOCK_EVENT_STATS[eventId] = { pending: 0, approved: 0, excluded: 0 };
      }
      
      const donor = MOCK_DONORS.find(d => d.id === parseInt(donorId));
      if (donor) {
        if (donor.status === 'approved') MOCK_EVENT_STATS[eventId].approved += 1;
        else if (donor.status === 'pending') MOCK_EVENT_STATS[eventId].pending += 1;
        else if (donor.status === 'excluded') MOCK_EVENT_STATS[eventId].excluded += 1;
      }
    }
    
    return { success: true, message: 'Donor added to event' };
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

    const response = await fetch(`${API_URL}/api/events/${eventId}/donors/${donorId}`, {
      method: 'DELETE',
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
    console.error('Error removing donor from event:', error);
    console.warn('Using mock data due to API failure');
    
    // Update mock data
    if (MOCK_EVENT_DONORS[eventId]) {
      const donorIdInt = parseInt(donorId);
      
      // Find donor to update stats correctly
      const donor = MOCK_DONORS.find(d => d.id === donorIdInt);
      
      // Remove donor from event
      MOCK_EVENT_DONORS[eventId] = MOCK_EVENT_DONORS[eventId].filter(id => id !== donorIdInt);
      
      // Update stats
      if (MOCK_EVENT_STATS[eventId] && donor) {
        if (donor.status === 'approved') MOCK_EVENT_STATS[eventId].approved -= 1;
        else if (donor.status === 'pending') MOCK_EVENT_STATS[eventId].pending -= 1;
        else if (donor.status === 'excluded') MOCK_EVENT_STATS[eventId].excluded -= 1;
      }
    }
    
    return { success: true, message: 'Donor removed from event' };
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
    console.warn('Returning mock data due to API failure');
    
    // Return mock stats for this event
    const stats = MOCK_EVENT_STATS[eventId] || { pending: 0, approved: 0, excluded: 0 };
    
    return {
      event_id: parseInt(eventId),
      total_donors: (MOCK_EVENT_DONORS[eventId] || []).length,
      pending_review: stats.pending,
      approved: stats.approved,
      excluded: stats.excluded,
      approval_rate: stats.approved / (stats.approved + stats.excluded + stats.pending) * 100 || 0
    };
  }
}; 