import authService from '../services/authService';

// Create a generic fetch wrapper function to handle 401 errors
export const fetchWithAuthMiddleware = async (url, options = {}) => {
  const response = await fetch(url, options);
  
  // Check if it's a 401 error
  if (response.status === 401) {
    // Clear authentication information from local storage
    authService.logout();
    
    // Redirect to login page
    window.location.href = '/login';
    return;
  }
  
  // If it's not a 401 error, continue processing the response
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
    throw errorData;
  }
  
  return response;
};

// Create an axios interceptor configuration
export const setupAxiosInterceptors = (axios) => {
  // Response interceptor
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        // Clear authentication information from local storage
        authService.logout();
        
        // Redirect to login page
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
}; 