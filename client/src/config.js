// API Configuration
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Other configurations can be added here
export const APP_CONFIG = {
  // Pagination defaults
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  
  // Timeouts
  REQUEST_TIMEOUT: 30000, // 30 seconds
  
  // File upload limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  
  // Cache settings
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
}; 