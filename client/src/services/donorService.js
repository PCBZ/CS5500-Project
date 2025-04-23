import { fetchWithAuth } from './baseService';
import { API_URL } from '../config';
import { logout } from './authService';

// Helper function to convert JSON data to CSV
const jsonToCsv = (data, options = {}) => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Get all unique keys from data, excluding complex objects
  const headers = [...new Set(data.flatMap(item => 
    Object.keys(item).filter(key => 
      !Array.isArray(item[key]) && 
      typeof item[key] !== 'object' &&
      !options.excludeFields?.includes(key)
    )
  ))].sort();

  // Convert data to CSV rows
  const rows = data.map(item => 
    headers.map(header => {
      const value = item[header];
      // Handle special characters and wrap in quotes if needed
      const cellStr = String(value || '');
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    })
  );

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create blob with BOM for Excel compatibility
  const BOM = '\uFEFF';
  return new Blob([BOM + csvContent], { 
    type: 'text/csv;charset=utf-8'
  });
};

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
    // Build URL with query parameters
    const url = new URL(`${API_URL}/api/donors`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        url.searchParams.append(key, params[key]);
      }
    });

    const data = await fetchWithAuth(url.toString());
    
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
    throw error;
  }
};

/**
 * Get all donors with pagination and filtering
 * Special version for the all donors page
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Results per page
 * @param {string} params.search - Search term
 * @param {string} params.status - Filter by status
 * @param {string} params.type - Filter by donor type
 * @param {string} params.city - Filter by city
 * @param {string} params.minDonation - Filter by minimum donation amount
 * @param {string} params.pmm - Filter by PMM status
 * @param {string} params.excluded - Filter by exclusion status
 * @param {string} params.deceased - Filter by deceased status
 * @param {string} params.tags - Filter by tags
 * @returns {Promise<Object>} Donor data with pagination info
 */
export const getAllDonors = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && { search: params.search }),
      ...(params.city && { city: params.city }),
      ...(params.minDonation && { minDonation: params.minDonation }),
      ...(params.pmm && { pmm: params.pmm }),
      ...(params.excluded && { excluded: params.excluded }),
      ...(params.deceased && { deceased: params.deceased }),
      ...(params.tags && { tags: params.tags })
    }).toString();

    const data = await fetchWithAuth(`/api/donors?${queryParams}`);
    
    // Ensure we have valid data structure
    return {
      data: data.donors || [],
      page: data.page || 1,
      limit: data.limit || 10,
      total_count: data.total || 0,
      total_pages: data.pages || 1
    };
  } catch (error) {
    console.error('Error fetching donors:', error);
    throw error;
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
    // Use the new API endpoint
    const url = new URL(`${API_URL}/api/events/${eventId}/available-donors`);
    
    // Add pagination and search parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        url.searchParams.append(key, params[key]);
      }
    });
    const data = await fetchWithAuth(url.toString());
    
    // Return formatted data
    return {
      data: data.donors || [],
      page: data.page || 1,
      limit: data.limit || 10,
      total_count: data.total || 0,
      total_pages: data.pages || 1
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
    // Use /api/events/{eventId}/donors endpoint to add donor
    const data = await fetchWithAuth(`/api/events/${eventId}/donors`, {
      method: 'POST',
      body: JSON.stringify({ donorId })
    });

    return data;
  } catch (error) {
    console.error('Failed to add donor:', error);
    throw error;
  }
};

/**
 * Remove a donor from an event
 * @param {string} eventId - Event ID
 * @param {string} eventDonorId - Event Donor ID
 * @returns {Promise<Object>} Response data
 */
export const removeDonorFromEvent = async (eventId, eventDonorId) => {
  try {
    const result = await fetchWithAuth(`/api/events/${eventId}/donors/${eventDonorId}`, {
      method: 'DELETE'
    });
    return result;
  } catch (error) {
    console.error('Error removing donor from event:', error);
    throw error;
  }
};

/**
 * Get event-specific donor statistics by fetching and analyzing the donor list
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Statistics data
 */
export const getEventDonorStats = async (eventId) => {
  try {
    const donorsData = await fetchWithAuth(`/api/events/${eventId}/donors?limit=1000`);
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
    });
    
    // Calculate total and approval rate
    const total = donors.length;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    
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
    throw error;
  }
};

/**
 * Update the status of a donor in an event
 * @param {string} eventId - Event ID
 * @param {string} eventDonorId - Event Donor ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Response data
 */
export const updateDonorStatus = async (eventId, eventDonorId, status) => {
  try {
    const result = await fetchWithAuth(`/api/events/${eventId}/donors/${eventDonorId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    return result;
  } catch (error) {
    console.error('Error updating donor status:', error);
    throw error;
  }
};

/**
 * Update event donor information
 * @param {string} eventId - Event ID
 * @param {string} eventDonorId - Event Donor ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Response data
 */
export const updateEventDonor = async (eventId, eventDonorId, updateData) => {
  try {
    if (!eventId || !eventDonorId) {
      console.error('Missing required parameters:', { eventId, eventDonorId });
      throw new Error('Missing eventId or eventDonorId');
    }
    
    const result = await fetchWithAuth(`/api/events/${eventId}/donors/${eventDonorId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    });
    return result;
  } catch (error) {
    console.error('Error updating donor information:', error);
    throw error;
  }
};

/**
 * Export all donors to CSV
 * @returns {Promise<Blob>} CSV file as a blob
 */
export const exportDonorsToCsv = async () => {
  try {
    // First get all donors
    const response = await getAllDonors({ limit: 1000 });
    
    if (!response || !response.data) {
      throw new Error('No donor data received');
    }

    const donors = response.data;
    
    if (!donors || donors.length === 0) {
      throw new Error('No donors to export');
    }

    // Use the generic jsonToCsv function
    return jsonToCsv(donors, {
      excludeFields: ['eventDonors']
    });
  } catch (error) {
    console.error('Error exporting donors:', error);
    throw error;
  }
};

/**
 * Export event donors list to CSV
 * @param {string} eventId - Event ID
 * @returns {Promise<Blob>} CSV file as a blob
 */
export const exportEventDonorsToCsv = async (eventId) => {
  try {
    // Get event details
    const eventData = await fetchWithAuth(`/api/events/${eventId}`);
    const eventName = eventData.name || `Event-${eventId}`;
    
    // Get event donor list
    const donorsData = await fetchWithAuth(`/api/events/${eventId}/donors?limit=1000`);
    let eventDonors = donorsData.donors || [];
    
    if (eventDonors.length === 0) {
      throw new Error('No donors to export');
    }
    
    const donorPromises = eventDonors.map(async (eventDonor) => {
      // Get donor ID from eventDonor
      const donorId = eventDonor.donor?.id || eventDonor.donor_id || eventDonor.donorId;
      
      if (!donorId) {
        console.warn('Could not find donor ID:', eventDonor);
        return null;
      }
      
      // Skip excluded donors
      if (eventDonor.status === 'Excluded') {
        return null;
      }
      
      try {
        // Get complete donor data
        const donorData = await fetchWithAuth(`/api/donors/${donorId}`);
        
        // Skip deceased donors
        if (donorData.deceased === true || donorData.is_deceased === true) {
          console.log(`Skipping deceased donor ID=${donorId}`);
          return null;
        }
        
        // Return only donor data, not event donor relationship data
        return donorData;
      } catch (error) {
        console.error(`Error fetching data for donor ID=${donorId}:`, error.message);
        return null;
      }
    });
    
    // Wait for all donor data to be fetched and filter out nulls
    let enrichedDonors = await Promise.all(donorPromises);
    enrichedDonors = enrichedDonors.filter(donor => donor !== null);
    
    if (enrichedDonors.length === 0) {
      throw new Error('No valid donors to export');
    }

    // Use the generic jsonToCsv function
    return jsonToCsv(enrichedDonors, {
      excludeFields: ['eventDonors', 'tags', 'deceased', 'is_deceased']
    });
  } catch (error) {
    console.error('Error exporting event donors:', error);
    throw error;
  }
};

/**
 * Update donor information
 * @param {string} donorId - Donor ID
 * @param {Object} donorData - Updated donor data
 * @returns {Promise<Object>} Updated donor data
 */
export const updateDonor = async (donorId, donorData) => {
  try {
    const result = await fetchWithAuth(`/api/donors/${donorId}`, {
      method: 'PUT',
      body: JSON.stringify(donorData)
    });
    return result;
  } catch (error) {
    console.error('Error updating donor:', error);
    throw error;
  }
};

/**
 * Delete a donor
 * @param {string} donorId - Donor ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteDonor = async (donorId) => {
  try {
    const result = await fetchWithAuth(`/api/donors/${donorId}`, {
      method: 'DELETE'
    });
    return result;
  } catch (error) {
    console.error('Error deleting donor:', error);
    throw error;
  }
};

/**
 * Create a new donor
 * @param {Object} donorData - New donor data
 * @returns {Promise<Object>} Created donor data
 */
export const createDonor = async (donorData) => {
  try {
    const result = await fetchWithAuth('/api/donors', {
      method: 'POST',
      body: JSON.stringify(donorData)
    });
    return result;
  } catch (error) {
    console.error('Error creating donor:', error);
    throw error;
  }
};

/**
 * Add donors to a list
 * @param {number} listId - List ID
 * @param {Array} donorIds - Array of donor IDs
 * @returns {Promise<Object>} Addition result
 */
export const addDonorsToList = async (listId, donorIds) => {
  try {
    const numericDonorIds = donorIds.map(id => Number(id));
    const result = await fetchWithAuth(`/api/lists/${listId}/donors`, {
      method: 'POST',
      body: JSON.stringify({ donorIds: numericDonorIds })
    });
    return result;
  } catch (error) {
    console.error('Error adding donors to list:', error);
    throw error;
  }
};

/**
 * Import donor data from CSV or Excel file
 * @param {File} file - CSV or Excel file
 * @param {Function} onProgress - Progress callback function
 * @param {Function} onComplete - Completion callback function
 * @param {Function} onError - Error callback function
 * @returns {Promise<Object>} Object containing cancel function
 */
export const importDonors = async (file, onProgress, onComplete, onError) => {
  try {
    // Check file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension)) {
      throw new Error('Please select a CSV or Excel file');
    }

    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size exceeds the limit (10MB). Please select a smaller file.');
    }

    const formData = new FormData();
    formData.append('file', file);

    // Start import and get operation ID
    const response = await fetch(`${API_URL}/api/donors/import`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        sessionStorage.removeItem('token');
        logout();
      }
      const errorData = await response.json();
      throw new Error(errorData.message || `Import failed with status: ${response.status}`);
    }

    const data = await response.json();
    const { operationId } = data;
    
    if (!operationId) {
      throw new Error('No operation ID received from server');
    }

    // Create poller to track progress
    let pollingInterval;
    let attempts = 0;
    const maxAttempts = 300; // 10 minutes at 2 second intervals

    const pollProgress = async () => {
      try {
        const progressData = await fetchWithAuth(`/api/progress/${operationId}`);
        
        if (progressData.status === 'processing') {
          onProgress?.(progressData.progress || 0, progressData.message || 'Processing...');
        } else if (progressData.status === 'completed') {
          clearInterval(pollingInterval);
          onComplete?.(progressData.result || {});
        } else if (progressData.status === 'error') {
          clearInterval(pollingInterval);
          onError?.(new Error(progressData.message || 'Import failed'));
        }

        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(pollingInterval);
          throw new Error('Import timed out');
        }
      } catch (error) {
        clearInterval(pollingInterval);
        onError?.(error);
      }
    };

    // Start polling progress
    pollingInterval = setInterval(pollProgress, 2000);

    // Return cancel function
    return {
      cancel: async () => {
        try {
          clearInterval(pollingInterval);
          await fetchWithAuth(`/api/progress/${operationId}`, {
            method: 'DELETE'
          });
        } catch (error) {
          console.error('Failed to cancel import:', error);
          throw error;
        }
      }
    };
  } catch (error) {
    onError?.(error);
    throw error;
  }
};

/**
 * Get recommended donors for an event
 * @param {string} eventId - Event ID
 * @returns {Promise<Array>} Array of recommended donors
 */
export const getRecommendedDonors = async (eventId) => {
  try {
    console.log('Fetching recommended donors for event:', eventId);
    const data = await fetchWithAuth(`${API_URL}/api/events/${eventId}/recommended-donors`);
    
    if (!data) {
      console.error('No data received from fetchWithAuth');
      return [];
    }

    console.log('Received recommended donors data:', {
      count: data.recommendedDonors?.length || 0,
      sample: data.recommendedDonors?.[0]
    });

    if (!data.recommendedDonors) {
      console.warn('No recommendedDonors field in response:', data);
      return [];
    }

    return data.recommendedDonors;
  } catch (error) {
    console.error('Error in getRecommendedDonors:', error);
    throw error;
  }
}; 