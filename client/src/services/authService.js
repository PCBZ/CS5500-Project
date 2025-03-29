import { fetchWithAuthMiddleware } from '../middleware/authMiddleware';

// API base URL
const API_URL = 'http://localhost:3000/api/user';

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
  const response = await fetchWithAuthMiddleware(`${API_URL}${endpoint}`, options);
  
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
    const data = await fetchWithAuth('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    const { token, user } = data;
    // Store token and user info in local storage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch (error) {
    throw error.message ? error : new Error('Login failed, please check your credentials');
  }
};

// User logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
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