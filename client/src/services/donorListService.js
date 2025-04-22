import { fetchWithAuth } from './baseService';

// Get summary statistics for all donor lists
export const getDonorListsSummary = async () => {
  try {
    const response = await fetchWithAuth('/api/lists/stats/summary');
    return response;
  } catch (error) {
    console.error('Error fetching donor lists summary:', error);
    throw error;
  }
};

// Get statistics for a specific donor list
export const getDonorListStats = async (listId) => {
  try {
    const response = await fetchWithAuth(`/api/lists/${listId}/stats`);
    return response;
  } catch (error) {
    console.error(`Error fetching stats for donor list ${listId}:`, error);
    throw error;
  }
};

// Get donor lists with pagination and filtering
export const getDonorLists = async (page = 1, limit = 10, status = '') => {
  try {
    // Build URL query parameters
    const url = new URL(`${API_URL}/api/lists`);
    if (page) url.searchParams.append('page', page);
    if (limit) url.searchParams.append('limit', limit);
    if (status) url.searchParams.append('status', status);

    const response = await fetchWithAuth(url.toString());
    return response;
  } catch (error) {
    console.error('Error fetching donor lists:', error);
    throw error;
  }
}; 