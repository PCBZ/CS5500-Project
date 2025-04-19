import { fetchWithAuthMiddleware } from '../middleware/authMiddleware';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Create a generic fetch function with authentication
const fetchWithAuth = async (endpoint, options = {}) => {
  // Ensure headers exist
  if (!options.headers) {
    options.headers = {};
  }
  
  // Add content type header
  options.headers['Content-Type'] = 'application/json';
  
  // Add token to request header if it exists
  const token = localStorage.getItem('token');
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Execute the request using middleware
  const response = await fetchWithAuthMiddleware(`${API_URL}/api/user${endpoint}`, options);
  
  // Throw error if response is not successful
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
    throw errorData;
  }
  
  // Return response data
  return response.json();
};

// User registration
export const register = async (userData) => {
  try {
    const data = await fetchWithAuth('/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    return data;
  } catch (error) {
    throw error.message ? error : new Error('Registration failed, please try again later');
  }
};

// User login
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/api/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
      console.error('Login failed:', errorData);
      throw errorData;
    }

    const data = await response.json();
    
    // Store token and user data in localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
      console.log('Token stored successfully');
      
      // Store user data if available
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('User data stored successfully');
      }
      
      // Use different routing format based on environment
      if (process.env.NODE_ENV === 'production') {
        // Use hash router in production environment
        window.location.href = '#/dashboard';
      } else {
        // Use standard router in development environment
        window.location.href = '/dashboard';
      }
    } else {
      console.warn('No token received in login response');
      throw new Error('No authentication token received');
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error.message ? error : new Error('Login failed, please check your credentials');
  }
};

// User logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Use different routing format based on environment
  if (process.env.NODE_ENV === 'production') {
    // Use hash router in production environment
    window.location.href = '#/login';
  } else {
    // Use standard router in development environment
    window.location.href = '/login';
  }
};

// Get current logged-in user
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  isAuthenticated
}; 


export default authService;