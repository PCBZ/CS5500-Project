import authService from '../services/authService';

// Create a generic fetch wrapper function to handle 401 errors
export const withAuth = async (response) => {
  // Check if it's a 401 error
  if (response.status === 401) {
    // Clear authentication information from local storage
    authService.logout();
    return;
  }
  
  // If it's not a 401 error, continue processing the response
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
    throw errorData;
  }
  
  return response;
};

// Create a fetch wrapper, using middleware
export const fetchWithAuth = async (url, options = {}) => {
  const response = await fetch(url, options);
  return withAuth(response);
};