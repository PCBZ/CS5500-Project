import { fetchWithAuthMiddleware } from '../middleware/authMiddleware';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Get summary statistics for all donor lists
export const getDonorListsSummary = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetchWithAuthMiddleware(`${API_URL}/api/lists/stats/summary`, {
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
    console.error('Error fetching donor lists summary:', error);
    throw error;
  }
};

// Get statistics for a specific donor list
export const getDonorListStats = async (listId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetchWithAuthMiddleware(`${API_URL}/api/lists/${listId}/stats`, {
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
    console.error(`Error fetching stats for donor list ${listId}:`, error);
    throw error;
  }
};

// Get donor lists with pagination and filtering
export const getDonorLists = async (page = 1, limit = 10, status = '') => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Build URL query parameters
    const url = new URL(`${API_URL}/api/lists`);
    if (page) url.searchParams.append('page', page);
    if (limit) url.searchParams.append('limit', limit);
    if (status) url.searchParams.append('status', status);

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

    return await response.json();
  } catch (error) {
    console.error('Error fetching donor lists:', error);
    throw error;
  }
}; 