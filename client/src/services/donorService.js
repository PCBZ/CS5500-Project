// Import mock data from mockData module
// import { MOCK_DONORS, MOCK_EVENT_DONORS, MOCK_EVENT_STATS } from './mockData';
import { getEventDonors } from './eventService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const getAuthToken = () => localStorage.getItem('token');

/**
 * Import donors from CSV or Excel file
 * @param {FormData} formData - FormData containing the file to import
 * @returns {Promise<Object>} Import results
 */
export const importDonors = async (formData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('Starting donor import process');
    
    // Make the API call to the import endpoint
    const response = await fetch(`${API_URL}/api/donors/import`, {
      method: 'POST',
      headers: {
        // Don't set Content-Type header when using FormData
        // The browser will set the correct Content-Type with boundary
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    // Check if response is not JSON (e.g., HTML error page from session timeout)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Get full response for debugging
      const responseText = await response.text();
      console.error('Received non-JSON response:', responseText);
      
      // Check if it's a login page redirect
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
        throw new Error('Your session has expired. Please refresh the page and login again.');
      } else {
        throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
      }
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Import failed:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Import completed successfully:', data);
    
    return {
      success: true,
      imported: data.imported || 0,
      updated: data.updated || 0, 
      errors: data.errors || [],
      message: data.message || 'Import completed successfully'
    };
  } catch (error) {
    console.error('Error importing donors:', error);
    return {
      success: false,
      message: error.message || 'Import failed'
    };
  }
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
    throw error; // No longer return mock data, pass error to caller
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
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

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

    const response = await fetch(`${API_URL}/api/donors?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch donors: ${response.status}`);
    }

    const data = await response.json();
    
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

/**
 * Export event donors list to CSV
 * @param {string} eventId - Event ID
 * @returns {Promise<Blob>} CSV file as a blob
 */
export const exportEventDonorsToCsv = async (eventId) => {
  console.log(`Starting export for event ID: ${eventId}`);
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Get event details
    const eventResponse = await fetch(`${API_URL}/api/events/${eventId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!eventResponse.ok) {
      throw new Error(`HTTP error! status: ${eventResponse.status}`);
    }
    
    const eventData = await eventResponse.json();
    const eventName = eventData.name || `Event-${eventId}`;
    console.log(`Exporting donors for event: ${eventName}`);
    
    // Get event donor list
    const response = await fetch(`${API_URL}/api/events/${eventId}/donors?limit=1000`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const donorsData = await response.json();
    let eventDonors = donorsData.donors || [];
    console.log(`Found ${eventDonors.length} donor relationship records`);
    
    if (eventDonors.length === 0) {
      throw new Error('No donors to export');
    }
    
    // Get complete donor data from API
    console.log('Fetching complete donor data for each donor...');
    const donorPromises = eventDonors.map(async (eventDonor) => {
      // Get donor ID from eventDonor
      const donorId = eventDonor.donor?.id || eventDonor.donor_id || eventDonor.donorId;
      
      if (!donorId) {
        console.warn('Could not find donor ID:', eventDonor);
        return null; // Return null to filter out later
      }
      
      // Skip excluded donors
      if (eventDonor.status === 'Excluded') {
        console.log(`Skipping excluded donor ID=${donorId}`);
        return null;
      }
      
      try {
        // Get complete donor data
        console.log(`Fetching data for donor ID=${donorId}`);
        const donorResponse = await fetch(`${API_URL}/api/donors/${donorId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!donorResponse.ok) {
          console.warn(`Unable to get data for donor ID=${donorId}, status: ${donorResponse.status}`);
          return null; // Return null to filter out later
        }
        
        const donorData = await donorResponse.json();
        
        // Skip deceased donors
        if (donorData.deceased === true || donorData.is_deceased === true) {
          console.log(`Skipping deceased donor ID=${donorId}`);
          return null;
        }
        
        // Return only donor data, not event donor relationship data
        return donorData;
      } catch (error) {
        console.warn(`Error fetching data for donor ID=${donorId}:`, error.message);
        return null; // Return null to filter out later
      }
    });
    
    // Wait for all donor data to be fetched and filter out nulls
    let enrichedDonors = await Promise.all(donorPromises);
    enrichedDonors = enrichedDonors.filter(donor => donor !== null);
    
    console.log(`All donor data fetched, valid data: ${enrichedDonors.length} records`);
    
    // Print sample data to check structure
    if (enrichedDonors.length > 0) {
      console.log('Sample donor data structure:', JSON.stringify(enrichedDonors[0], null, 2));
    } else {
      throw new Error('No valid donors to export');
    }
    
    // Generate safe filename
    const safeName = eventName
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    const fileName = `${safeName}_donor_data_${new Date().toISOString().slice(0, 10)}.csv`;
    
    // Define standard fields (in order) - only include donor fields
    const standardFields = [
      { key: 'id', header: 'Donor ID' },
      { key: ['firstName', 'first_name'], header: 'First Name' },
      { key: ['lastName', 'last_name'], header: 'Last Name' },
      { key: ['organizationName', 'organization_name'], header: 'Organization' },
      { key: 'email', header: 'Email' },
      { key: 'phone', header: 'Phone' },
      { key: 'address', header: 'Address' },
      { key: 'city', header: 'City' },
      { key: ['state', 'province'], header: 'State/Province' },
      { key: ['postalCode', 'postal_code', 'zipCode', 'zip_code'], header: 'Postal Code' },
      { key: 'country', header: 'Country' },
      { key: ['totalDonations', 'total_donations'], header: 'Total Donations' },
      { key: ['lastGiftDate', 'last_gift_date'], header: 'Last Gift Date', isDate: true },
      { key: ['lastGiftAmount', 'last_gift_amount'], header: 'Last Gift Amount' },
      { key: ['primaryContact', 'primary_contact'], header: 'Primary Contact' },
      { key: 'notes', header: 'Notes' }
    ];
    
    // List of event donor relationship fields to exclude
    const eventDonorFields = [
      'status', 'comments', 'exclude_reason', 'review_date', 'event_id', 
      'donor_id', 'event_donor_id', 'created_at', 'updated_at', 'tags',
      'eventDonors', 'auto_excluded', 'donor', 'donorId', 'donor_list_id',
      'eventId', 'event_donor_list_id'
    ];
    
    // Build available fields set
    let availableFields = new Set();
    let dynamicFields = new Map(); // Maps field names to their array index
    
    // Check all donors for available fields
    enrichedDonors.forEach(donor => {
      // Add all donor object fields to our set (excluding event donor fields)
      Object.keys(donor).forEach(key => {
        // Check if this is not an event donor field, not tags and not deceased field
        if (!eventDonorFields.includes(key) && 
            key !== 'tags' && 
            key !== 'deceased' && 
            key !== 'is_deceased') {
          availableFields.add(key);
        }
      });
    });
    
    console.log('All available donor fields found:', 
                Array.from(availableFields).sort().join(', '));
    
    // Create CSV headers and field mapping
    const headers = [];
    
    // Add standard fields first
    standardFields.forEach((field, index) => {
      headers.push(field.header);
      
      // For array of possible keys, store the index for each possible key
      if (Array.isArray(field.key)) {
        field.key.forEach(k => {
          dynamicFields.set(k, {
            index,
            isDate: field.isDate || false
          });
        });
      } else {
        dynamicFields.set(field.key, {
          index,
          isDate: field.isDate || false
        });
      }
    });
    
    // Add any fields found in the data but not in our standard list (excluding event donor fields)
    const additionalFields = Array.from(availableFields).filter(field => {
      // Don't include any event donor fields or excluded fields
      if (eventDonorFields.includes(field) || 
          field === 'tags' || 
          field === 'deceased' || 
          field === 'is_deceased') {
        return false;
      }
      
      return !standardFields.some(sf => 
        sf.key === field || (Array.isArray(sf.key) && sf.key.includes(field))
      );
    }).sort();
    
    // Add these fields to our headers
    additionalFields.forEach(field => {
      // Format header: convert snake_case or camelCase to Title Case
      let header = field.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1')
                      .replace(/^./, str => str.toUpperCase());
      
      headers.push(header);
      
      // Add to our dynamic fields map
      dynamicFields.set(field, {
        index: headers.length - 1,
        isDate: field.includes('date') || field.includes('Date')
      });
    });
    
    console.log('Final CSV headers:', headers);
    
    // Format CSV donor data
    const rows = enrichedDonors.map(donor => {
      // Prepare array for this row
      const rowData = new Array(headers.length).fill('');
      
      // Process donor object fields
      Object.entries(donor).forEach(([key, value]) => {
        // Skip event donor fields
        if (eventDonorFields.includes(key) || 
            key === 'tags' || 
            key === 'deceased' || 
            key === 'is_deceased') {
          return;
        }
        
        if (dynamicFields.has(key)) {
          const fieldInfo = dynamicFields.get(key);
          let processedValue = value;
          
          // Format dates
          if (fieldInfo.isDate && value) {
            try {
              processedValue = new Date(value).toLocaleDateString();
            } catch (e) {
              processedValue = value;
            }
          }
          
          // Handle arrays (although we're skipping tags, keep this for other array fields)
          if (Array.isArray(value)) {
            processedValue = value.join('; ');
          }
          
          rowData[fieldInfo.index] = processedValue;
        }
      });
      
      return rowData;
    });
    
    // Combine headers and rows into CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Ensure cell is a string
        const cellStr = cell === null || cell === undefined ? '' : String(cell);
        // Handle commas, quotes, and newlines in strings
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
    ].join('\n');
    
    // Create and return blob
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  } catch (error) {
    console.error('Error exporting donors to CSV:', error);
    throw error;
  }
};

/**
 * Export all donors to CSV
 * @returns {Promise<Object>} CSV data as blob and success status
 */
export const exportDonorsToCsv = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_URL}/api/donors/export`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to export donors: ${response.status}`);
    }

    const blob = await response.blob();
    return {
      success: true,
      data: blob,
      fileName: `donors_export_${new Date().toISOString().split('T')[0]}.csv`
    };
  } catch (error) {
    console.error('Error exporting donors:', error);
    throw error;
  }
};

/**
 * Update donor information
 * @param {string} donorId - The ID of the donor to update
 * @param {Object} donorData - Updated donor data
 * @returns {Promise<Object>} Updated donor data
 */
export const updateDonor = async (donorId, donorData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_URL}/api/donors/${donorId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(donorData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update donor: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating donor:', error);
    throw error;
  }
};

/**
 * Delete a donor
 * @param {string} donorId - The ID of the donor to delete
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteDonor = async (donorId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    console.log(`Attempting to delete donor with ID: ${donorId}`);

    const response = await fetch(`${API_URL}/api/donors/${donorId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('Delete donor response:', response.status, data);

    if (!response.ok) {
      throw new Error(data.message || `Failed to delete donor: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Error deleting donor:', error);
    throw error;
  }
};

/**
 * Create a new donor
 * @param {Object} donorData - New donor data
 * @returns {Promise<Object>} - Created donor data
 */
export const createDonor = async (donorData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_URL}/api/donors`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(donorData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create donor: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating donor:', error);
    throw error;
  }
}; 