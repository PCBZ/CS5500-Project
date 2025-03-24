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

    console.log('Getting available donors for event ID', eventId);
    
    // Step 1: Get all donors
    const allDonorsUrl = new URL(`${API_URL}/api/donors`);
    
    // Add pagination and search parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        allDonorsUrl.searchParams.append(key, params[key]);
      }
    });
    
    // Get all donors list
    console.log('Fetching all donors:', allDonorsUrl.toString());
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
    console.log('Total donors fetched:', allDonorsData.donors.length);
    
    // Step 2: Get donor IDs already in the event
    let eventDonorIds = new Set();
    try {
      // Use /api/events/:id/donors endpoint to get event donors
      const eventDonorsUrl = new URL(`${API_URL}/api/events/${eventId}/donors?limit=1000`);
      // Add no_sort parameter to avoid server-side sorting errors
      eventDonorsUrl.searchParams.set('no_sort', 'true');
      console.log('Fetching event donors:', eventDonorsUrl.toString());
      
      const eventDonorsResponse = await fetch(eventDonorsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (eventDonorsResponse.ok) {
        const eventDonorsData = await eventDonorsResponse.json();
        console.log('Event donors data received');
        
        // Process event donors data to get all donor IDs that are already in the event
        if (eventDonorsData.donors && Array.isArray(eventDonorsData.donors)) {
          eventDonorsData.donors.forEach(ed => {
            // Handle the nested structure for donor object
            if (ed.donor && ed.donor.id) {
              eventDonorIds.add(ed.donor.id.toString());
            } 
            // Handle the direct donor_id field
            else if (ed.donor_id) {
              eventDonorIds.add(ed.donor_id.toString());
            }
            // Handle the donorId field
            else if (ed.donorId) {
              eventDonorIds.add(ed.donorId.toString());
            }
          });
          console.log('Donor IDs already in event:', Array.from(eventDonorIds));
        }
      } else if (eventDonorsResponse.status === 404) {
        // If 404, the list may not exist
        console.log('Event donor list may not exist, will return all donors');
      } else {
        console.error('Failed to get event donors:', eventDonorsResponse.status);
      }
    } catch (error) {
      console.error('Error getting event donors:', error);
      console.log('Ignoring error and continuing');
    }

    // Step 3: Filter out donors not in the event
    const availableDonors = allDonorsData.donors.filter(donor => {
      // Convert donor id to string for comparison
      const donorId = donor.id.toString();
      return !eventDonorIds.has(donorId);
    });
    
    console.log('Number of available donors after filtering:', availableDonors.length);
    
    // Return filtered results
    return {
      data: availableDonors || [],
      page: allDonorsData.page || 1,
      limit: allDonorsData.limit || 10,
      total_count: availableDonors.length,
      total_pages: Math.ceil(availableDonors.length / (allDonorsData.limit || 10))
    };
  } catch (error) {
    console.error('Error fetching available donors:', error);
    throw error;
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

    console.log(`Adding donor ${donorId} to event ${eventId}`);
    
    // Use /api/events/{eventId}/donors endpoint to add donor
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
      console.error('Failed to add donor:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Donor added successfully:', result);
    return result;
  } catch (error) {
    console.error('Error adding donor to event:', error);
    throw error;
  }
};

/**
 * Remove a donor from an event
 * @param {string} eventId - Event ID
 * @param {string} eventDonorId - Event Donor ID (the ID of the donor-event relationship record)
 * @returns {Promise<Object>} Response data
 */
export const removeDonorFromEvent = async (eventId, eventDonorId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log(`Removing donor relationship ${eventDonorId} from event ${eventId}`);
    
    // Use /api/events/{eventId}/donors/{eventDonorId} endpoint to remove donor
    const response = await fetch(`${API_URL}/api/events/${eventId}/donors/${eventDonorId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to remove donor:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Donor removed successfully:', result);
    return result;
  } catch (error) {
    console.error('Error removing donor from event:', error);
    throw error; // Pass the error to the caller
  }
};

/**
 * Get event-specific donor statistics by fetching and analyzing the donor list
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Statistics data
 */
export const getEventDonorStats = async (eventId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Fetch all donors for this event (with a high limit to get all records)
    const donorsResponse = await fetch(`${API_URL}/api/events/${eventId}/donors?limit=1000`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!donorsResponse.ok) {
      throw new Error(`HTTP error! status: ${donorsResponse.status}`);
    }

    const donorsData = await donorsResponse.json();
    const donors = donorsData.donors || [];
    
    // Calculate statistics based on donor data
    let pending = 0;
    let approved = 0;
    let excluded = 0;
    
    donors.forEach(donor => {
      // Check status field
      if (donor.status === 'Pending') {
        pending++;
      } else if (donor.status === 'Approved') {
        approved++;
      } else if (donor.status === 'Excluded' || donor.auto_excluded) {
        excluded++;
      }
      // If status is missing, check auto_excluded field
      else if (donor.auto_excluded) {
        excluded++;
      }
    });
    
    // Calculate total and approval rate
    const total = donors.length;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    
    console.log('Calculated donor statistics:', {
      total_donors: total,
      pending_review: pending,
      approved: approved,
      excluded: excluded,
      approval_rate: approvalRate
    });
    
    return {
      event_id: parseInt(eventId),
      total_donors: total,
      pending_review: pending,
      approved: approved,
      excluded: excluded,
      approval_rate: approvalRate
    };
  } catch (error) {
    console.error('Error calculating event donor statistics:', error);
    // Return a default empty stats object if calculation fails
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

/**
 * Update the status of a donor in an event
 * @param {string} eventId - Event ID
 * @param {string} eventDonorId - Event Donor ID (the ID of the donor-event relationship record)
 * @param {string} status - New status ('Pending', 'Approved', or 'Excluded')
 * @returns {Promise<Object>} Response data
 */
export const updateDonorStatus = async (eventId, eventDonorId, status) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log(`Updating status for donor relationship ${eventDonorId} in event ${eventId} to ${status}`);
    
    // Use PATCH request to update donor status
    const response = await fetch(`${API_URL}/api/events/${eventId}/donors/${eventDonorId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to update donor status:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Donor status updated successfully:', result);
    return result;
  } catch (error) {
    console.error('Error updating donor status:', error);
    throw error;
  }
};

/**
 * Update the event donor information (comments, auto_excluded, etc.)
 * @param {string} eventId - Event ID
 * @param {string} eventDonorId - Event Donor ID (the ID of the donor-event relationship record)
 * @param {Object} updateData - Data to update (comments, auto_excluded, etc.)
 * @returns {Promise<Object>} Response data
 */
export const updateEventDonor = async (eventId, eventDonorId, updateData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log(`Updating donor with ID ${eventDonorId} in event ${eventId}`, updateData);
    
    if (!eventId || !eventDonorId) {
      console.error('Missing required parameters:', { eventId, eventDonorId });
      throw new Error('Missing eventId or eventDonorId');
    }
    
    // Use PATCH request to update donor information
    const response = await fetch(`${API_URL}/api/events/${eventId}/donors/${eventDonorId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Failed to update donor (status: ${response.status}):`, errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Donor information updated successfully:', result);
    return result;
  } catch (error) {
    console.error('Error updating donor information:', error);
    throw error;
  }
}; 