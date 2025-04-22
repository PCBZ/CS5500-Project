import { API_URL } from '../config';

// User registration
export const register = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/api/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Registration failed' }));
      throw errorData;
    }

    return response.json();
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
    
    // Store token and user data in sessionStorage
    if (data.token) {
      sessionStorage.setItem('token', data.token);
      console.log('Token stored successfully');
      
      // Store user data if available
      if (data.user) {
        sessionStorage.setItem('user', JSON.stringify(data.user));
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
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  
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
  const userStr = sessionStorage.getItem('user');
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return sessionStorage.getItem('token') !== null;
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  isAuthenticated
}; 

export default authService;