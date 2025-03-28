// eventService.js

const API_URL = 'http://localhost:3000/api';

const fetchWithAuth = async (endpoint, options = {}) => {
  if (!options.headers) {
    options.headers = {};
  }
  
  options.headers['Content-Type'] = 'application/json';
  
  const token = localStorage.getItem('token');
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
    throw errorData;
  }
  
  return response.json();
};

export const getEvents = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    const endpoint = `/events${queryString ? `?${queryString}` : ''}`;
    
    return await fetchWithAuth(endpoint, {
      method: 'GET'
    });
  } catch (error) {
    throw error.message ? error : new Error('Failed to fetch events');
  }
};

export const getEventById = async (id) => {
  try {
    return await fetchWithAuth(`/events/${id}`, {
      method: 'GET'
    });
  } catch (error) {
    throw error.message ? error : new Error(`Failed to fetch event with ID: ${id}`);
  }
};

export const createEvent = async (eventData) => {
  try {
    return await fetchWithAuth('/events', {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  } catch (error) {
    throw error.message ? error : new Error('Failed to create event');
  }
};

export const updateEvent = async (id, eventData) => {
  try {
    return await fetchWithAuth(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData)
    });
  } catch (error) {
    throw error.message ? error : new Error(`Failed to update event with ID: ${id}`);
  }
};

export const deleteEvent = async (id) => {
  try {
    return await fetchWithAuth(`/events/${id}`, {
      method: 'DELETE'
    });
  } catch (error) {
    throw error.message ? error : new Error(`Failed to delete event with ID: ${id}`);
  }
};

export const updateEventStatus = async (id, status) => {
  try {
    return await fetchWithAuth(`/events/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  } catch (error) {
    throw error.message ? error : new Error(`Failed to update status for event with ID: ${id}`);
  }
};


// 获取所有事件类型
export const getEventTypes = async () => {
  try {
    return await fetchWithAuth('/events/types');
    ;
  } catch (error) {
    console.error('Error fetching event types:', error);
    throw error;
  }
};

// 获取所有地点
export const getEventLocations = async () => {
  try {
    return await fetchWithAuth('/events/locations');
  
  } catch (error) {
    console.error('Error fetching event locations:', error);
    throw error;
  }
};



const eventAPI =  {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  getEventTypes,
  getEventLocations
};

export default eventAPI;