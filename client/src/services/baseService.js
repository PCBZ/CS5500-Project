import { API_URL } from '../config';

/**
 * Fetch data with authentication
 * @param {string} url - The URL to fetch (can be relative or absolute)
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} The fetch response
 */
export const fetchWithAuth = async (url, options = {}) => {
  try {
    // Get token from sessionStorage
    const token = sessionStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Ensure URL is absolute
    const absoluteUrl = url.startsWith('http') ? url : `${API_URL}${url}`;

    // Set default headers
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Make the request
    const response = await fetch(absoluteUrl, {
      ...options,
      headers
    });

    // Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};