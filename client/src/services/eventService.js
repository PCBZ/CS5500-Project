import { fetchWithAuth } from './baseService';
import { API_URL } from '../config';
import { toFrontendStatus, toBackendStatus } from '../utils/statusConversion';

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
    const url = new URL(`${API_URL}/api/events`);
    
    // Add query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        url.searchParams.append(key, params[key]);
      }
    });

    const data = await fetchWithAuth(url.toString());
    
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
 * Get event details by ID
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Event details
 */
export const getEventById = async (eventId) => {
  try {
    return await fetchWithAuth(`${API_URL}/api/events/${eventId}`);
  } catch (error) {
    console.error('Error fetching event:', error);
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
    const responseData = await fetchWithAuth(`${API_URL}/api/events`, {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
    
    // Include automatically created donor list information
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
    const url = new URL(`${API_URL}/api/events/${eventId}/donors`);
    
    // Add query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        url.searchParams.append(key, params[key]);
      }
    });
    
    // Always add no_sort=true parameter to avoid 500 error from server using non-existent createdAt field for sorting
    url.searchParams.set('no_sort', 'true');

    try {
      const responseData = await fetchWithAuth(url.toString());
      
      // If response message includes needsListCreation flag, pass it to caller
      const needsListCreation = responseData.needsListCreation || false;
      
      // Format the response data
      return {
        data: Array.isArray(responseData.donors) ? responseData.donors.map(donor => ({
          ...donor,
          id: donor.donorId || donor.donor_id,
          firstName: donor.donor?.firstName || donor.donor?.first_name || '',
          lastName: donor.donor?.lastName || donor.donor?.last_name || '',
          email: donor.donor?.email || '',
          phone: donor.donor?.phone || '',
          organizationName: donor.donor?.organizationName || donor.donor?.organization_name || '',
          totalDonations: donor.donor?.totalDonations || donor.donor?.total_donations || 0,
          largestGift: donor.donor?.largestGift || donor.donor?.largest_gift || 0,
          firstGiftDate: donor.donor?.firstGiftDate || donor.donor?.first_gift_date || null,
          lastGiftDate: donor.donor?.lastGiftDate || donor.donor?.last_gift_date || null,
          lastGiftAmount: donor.donor?.lastGiftAmount || donor.donor?.last_gift_amount || 0,
          status: donor.status || 'pending',
          name: donor.donor ? 
            `${donor.donor.firstName || donor.donor.first_name || ''} ${donor.donor.lastName || donor.donor.last_name || ''}`.trim() || 
            donor.donor.organizationName || donor.donor.organization_name || 'Unnamed' : 
            'Unknown'
        })) : [],
        page: responseData.page || params.page || 1,
        limit: responseData.limit || params.limit || 10,
        total_count: responseData.total || 0,
        total_pages: responseData.pages || 1,
        needsListCreation,
        message: responseData.message
      };
    } catch (error) {
      // Handle 404 error, indicating event may have no donor list
      if (error.status === 404) {
        console.warn('Event has no donor list:', error.message);
        
        // Return empty result with flag indicating list creation is needed
        return {
          data: [],
          page: params.page || 1,
          limit: params.limit || 10,
          total_count: 0,
          total_pages: 0,
          needsListCreation: true,
          message: error.message || 'Event has no donor list'
        };
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error fetching event donors:', error);
    throw error;
  }
};

/**
 * Create a new donor list for an event
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Donor list data
 */
export const createEventDonorList = async (eventId) => {
  try {
    const result = await fetchWithAuth(`/api/events/${eventId}/donor-list`, {
      method: 'POST',
      body: JSON.stringify({ eventId })
    });
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
    // Convert frontend status to backend status
    const modifiedEventData = {
      ...eventData,
      status: toBackendStatus(eventData.status)
    };

    const updatedEvent = await fetchWithAuth(`/api/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(modifiedEventData)
    });
    
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
    await fetchWithAuth(`/api/events/${eventId}`, {
      method: 'DELETE'
    });
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
    const data = await fetchWithAuth(`/api/events/types`);
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
    const data = await fetchWithAuth(`/api/events/locations`);
    return data.locations || [];
  } catch (error) {
    console.error('Error fetching event locations:', error);
    throw error;
  }
}; 