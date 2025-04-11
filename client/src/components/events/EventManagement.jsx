import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaClock, FaTrash, FaFilter, FaSearch, FaEdit, FaEye } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import './EventManagement.css';
import { getEvents, updateEvent, deleteEvent } from '../../services/eventService';
import authService from '../../services/authService.js';
import CreateNewEvent from './CreateNewEvent.jsx';

const EventManagement = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const history = useHistory();

  const [filters, setFilters] = useState({
    status: '',
    location: '',
    type: '',
    dateRange: '',
    customStartDate: '',
    customEndDate: ''
  });

  const [eventTypes, setEventTypes] = useState([]);
  const [eventLocations, setEventLocations] = useState([]);
  
  const [filteredTypes, setFilteredTypes] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  
  const [showTypeOptions, setShowTypeOptions] = useState(false);
  const [showLocationOptions, setShowLocationOptions] = useState(false);

  const [originalEvents, setOriginalEvents] = useState([]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const openEditModal = (event) => {
    setCurrentEvent({...event});
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setCurrentEvent({
      ...currentEvent,
      [name]: value
    });
  };

  const saveEvent = async () => {
    setLoading(true);
    try {
      await updateEvent(currentEvent.id, currentEvent);
      
      const updatedEvents = originalEvents.map(event => 
        event.id === currentEvent.id ? currentEvent : event
      );
      
      setEvents(updatedEvents);
      setOriginalEvents(updatedEvents);
      setShowEditModal(false);
      setCurrentEvent(null);
    } catch (error) {
      console.error('Error updating event:', error);
      setError(error.message || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirm = (event) => {
    setEventToDelete(event);
    setShowDeleteConfirm(true);
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    
    setLoading(true);
    try {
      await deleteEvent(eventToDelete.id);
      
      const updatedEvents = originalEvents.filter(event => event.id !== eventToDelete.id);
      setEvents(updatedEvents);
      setOriginalEvents(updatedEvents);
      
      setShowDeleteConfirm(false);
      setEventToDelete(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      setError(error.message || 'Failed to delete event');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });

    if (name === 'type') {
      const matchedTypes = eventTypes.filter(type => 
        type.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredTypes(matchedTypes);
      setShowTypeOptions(value.length > 0);
    } else if (name === 'location') {
      const matchedLocations = eventLocations.filter(location => 
        location.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredLocations(matchedLocations);
      setShowLocationOptions(value.length > 0);
    }
    
    if (value === '' && (
        (name === 'type' && !filters.location && !filters.status && !filters.dateRange) ||
        (name === 'location' && !filters.type && !filters.status && !filters.dateRange) ||
        (name === 'status' && !filters.type && !filters.location && !filters.dateRange) ||
        (name === 'dateRange' && !filters.type && !filters.location && !filters.status)
      )) {
      setEvents(originalEvents);
    }
  };

  const handleSelectOption = (name, value) => {
    setFilters({
      ...filters,
      [name]: value
    });
    
    if (name === 'type') {
      setShowTypeOptions(false);
    } else if (name === 'location') {
      setShowLocationOptions(false);
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);

      try {
        if (authService.isAuthenticated()) {
          console.log('Token exists:', localStorage.getItem('token'));
          const eventsData = await getEvents();
          console.log('Events fetched successfully:', eventsData);

          if (eventsData && eventsData.data) {
            setEvents(eventsData.data);
            setOriginalEvents(eventsData.data);
            
            const types = [...new Set(eventsData.data.map(event => event.type).filter(Boolean))];
            const locations = [...new Set(eventsData.data.map(event => event.location).filter(Boolean))];
            
            setEventTypes(types);
            setEventLocations(locations);
          } else {
            setEvents([]);
            setOriginalEvents([]);
            console.warn('No events data found in response');
          }
        } else {
          setError('User not authenticated');
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setError(error.message || 'Failed to fetch events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setEvents(originalEvents);
      return;
    }
    const filteredEvents = originalEvents.filter((event) =>
      event.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setEvents(filteredEvents);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFilteredEvents = () => {
    const currentDate = new Date();
    
    if (activeTab === 'upcoming') {
      return events.filter(event => {
        if (!event || !event.date) return false;
        const eventDate = new Date(event.date);
        return eventDate >= currentDate;
      });
    } else if (activeTab === 'past') {
      return events.filter(event => {
        if (!event || !event.date) return false;
        const eventDate = new Date(event.date);
        return eventDate < currentDate;
      });
    } else {
      return events;
    }
  };

  const applyFilters = async () => {
    setLoading(true);
    setError(null);

    try {
      const filterParams = {};

      if (filters.status) filterParams.status = filters.status;
      if (filters.location) filterParams.location = filters.location; // 修改参数名，表示这是模糊匹配
      if (filters.type) filterParams.type = filters.type; // 修改参数名，表示这是模糊匹配
      
      if (filters.dateRange) {
        const now = new Date();
      
        if (filters.dateRange === '30days') {
          const thirtyDaysLater = new Date();
          thirtyDaysLater.setDate(now.getDate() + 30);
          filterParams.startDate = now.toISOString().split('T')[0];
          filterParams.endDate = thirtyDaysLater.toISOString().split('T')[0];
        } else if (filters.dateRange === '90days') {
          const ninetyDaysLater = new Date();
          ninetyDaysLater.setDate(now.getDate() + 90);
          filterParams.startDate = now.toISOString().split('T')[0];
          filterParams.endDate = ninetyDaysLater.toISOString().split('T')[0];
        } else if (filters.dateRange === 'thisYear') {
          const yearEnd = new Date(now.getFullYear(), 11, 31);
          filterParams.startDate = now.toISOString().split('T')[0];
          filterParams.endDate = yearEnd.toISOString().split('T')[0];
        } else if (filters.dateRange === 'custom') {
          if (filters.customStartDate) {
            filterParams.startDate = filters.customStartDate;
          }
          if (filters.customEndDate) {
            filterParams.endDate = filters.customEndDate;
          }
        }
      }
      
      if (searchQuery) {
        filterParams.search = searchQuery;
      }

      console.log('Applying filters with params:', filterParams);
      
      const eventsData = await getEvents(filterParams);

      if (eventsData && eventsData.data) {
        setEvents(eventsData.data);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Error applying filters:', error);
      setError(error.message || 'Failed to filter events');
    } finally {
      setLoading(false);
    }
  };

  const applyLocalFilters = () => {
    let filteredEvents = [...originalEvents];
    
    if (filters.status !== "") {
      filteredEvents = filteredEvents.filter(event => 
        event.status && event.status.toLowerCase() === filters.status.toLowerCase()
      );
    }
    
    if (filters.type) {
      filteredEvents = filteredEvents.filter(event => 
        event.type && event.type.toLowerCase().includes(filters.type.toLowerCase())
      );
    }
    
    if (filters.location) {
      filteredEvents = filteredEvents.filter(event => 
        event.location && event.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    
    // Update the date filtering in applyLocalFilters
    if (filters.dateRange) {
      const now = new Date();
      let startDate = now;
      let endDate;
      
      if (filters.dateRange === '30days') {
        endDate = new Date();
        endDate.setDate(now.getDate() + 30);
      } else if (filters.dateRange === '90days') {
        endDate = new Date();
        endDate.setDate(now.getDate() + 90);
      } else if (filters.dateRange === 'thisYear') {
        endDate = new Date(now.getFullYear(), 11, 31);
      } else if (filters.dateRange === 'custom') {
        if (filters.customStartDate) {
          startDate = new Date(filters.customStartDate);
        }
        if (filters.customEndDate) {
          endDate = new Date(filters.customEndDate);
        }
      }
      
      if (endDate) {
        filteredEvents = filteredEvents.filter(event => {
          if (!event.date) return false;
          const eventDate = new Date(event.date);
          return eventDate >= startDate && eventDate <= endDate;
        });
      }
    }
    
    if (searchQuery) {
      filteredEvents = filteredEvents.filter(event =>
        event.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setEvents(filteredEvents);
  };

  const handleViewEvent = (eventId) => {
    history.push('/donors', { selectedEventId: eventId });
  };

  const handleCreateEvent = () => {
    setShowCreateModal(true);
  };

  const handleEventCreated = (newEvent) => {
    setEvents(prevEvents => [...prevEvents, newEvent]);
    setOriginalEvents(prevEvents => [...prevEvents, newEvent]);
    setShowCreateModal(false);
    setSuccess('Event created successfully!');
    setTimeout(() => {
      setSuccess('');
    }, 3000);
  };

  const handleClickOutside = () => {
    setShowTypeOptions(false);
    setShowLocationOptions(false);
  };
  
  const resetAllFilters = () => {
    setFilters({
      status: '',
      location: '',
      type: '',
      dateRange: '',
      customStartDate: '',
      customEndDate: ''
    });
    setSearchQuery('');
    setEvents(originalEvents);
  };

  return (
    <div className="event-management-container" onClick={handleClickOutside}>
      <header className="event-management-header">
        <div>
          <h1>Event Management</h1>
          <p>Plan, organize and track fundraising events</p>
        </div>
        <button className="event-create-button" onClick={handleCreateEvent}>
          Create New Event
        </button>
      </header>

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <div className="event-tabs">
        <button
          className={`event-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming Events
        </button>
        <button
          className={`event-tab ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          Past Events
        </button>
        <button
          className={`event-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Events
        </button>

        <div className="event-search-filter">
          <div className="event-search">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search Events"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={handleKeyPress}
            />
          </div>
        </div>
      </div>

      <div className="filter-sidebar">
        <div className="filter-header">
          <FaFilter className="filter-icon" />
          <span>Filters</span>
        </div>
        <div className="filter-content">
          {/* 修改后的事件类型筛选，支持模糊匹配 */}
          <div className="filter-item">
            <label>Event Type</label>
            <div className="search-filter-container">
              <input
                type="text"
                name="type"
                placeholder="Search event type..."
                value={filters.type}
                onChange={handleFilterChange}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTypeOptions(true);
                  setFilteredTypes(eventTypes.filter(type => 
                    type.toLowerCase().includes(filters.type.toLowerCase())
                  ));
                }}
              />
              {showTypeOptions && filteredTypes.length > 0 && (
                <div className="filter-options">
                  {filteredTypes.map((type, index) => (
                    <div 
                      key={index} 
                      className="filter-option"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectOption('type', type);
                      }}
                    >
                      {type}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 修改后的位置筛选，支持模糊匹配 */}
          <div className="filter-item">
            <label>Location</label>
            <div className="search-filter-container">
              <input
                type="text"
                name="location"
                placeholder="Search location..."
                value={filters.location}
                onChange={handleFilterChange}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLocationOptions(true);
                  setFilteredLocations(eventLocations.filter(location => 
                    location.toLowerCase().includes(filters.location.toLowerCase())
                  ));
                }}
              />
              {showLocationOptions && filteredLocations.length > 0 && (
                <div className="filter-options">
                  {filteredLocations.map((location, index) => (
                    <div 
                      key={index} 
                      className="filter-option"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectOption('location', location);
                      }}
                    >
                      {location}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="filter-item">
            <label>Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Status</option>
              <option value="Planning">Planning</option>
              <option value="ListGeneration">List Generation</option>
              <option value="Review">Review</option>
              <option value="Ready">Ready</option>
              <option value="Complete">Complete</option>
            </select>
          </div>

        <div className="filter-item">
          <label>Date Range</label>
          <select
            name="dateRange"
            value={filters.dateRange}
            onChange={handleFilterChange}
          >
            <option value="">Any Date</option>
            <option value="30days">Next 30 Days</option>
            <option value="90days">Next 90 Days</option>
            <option value="thisYear">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
          
          {filters.dateRange === 'custom' && (
            <div className="custom-date-range">
              <div className="date-input-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="customStartDate"
                  value={filters.customStartDate}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="date-input-group">
                <label>End Date</label>
                <input
                  type="date"
                  name="customEndDate"
                  value={filters.customEndDate}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
          )}
        </div>

          {/* 筛选按钮组 */}
          <div className="filter-buttons">
            <button className="apply-filters-button" onClick={applyLocalFilters}>
              Apply Filters
            </button>
            <button className="reset-filters-button" onClick={resetAllFilters}>
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {loading && <div className="loading-message">Loading events...</div>}
      {error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        <div className="events-table-container">
          <table className="events-table">
            <thead>
              <tr>
                <th>EVENT NAME</th>
                <th>DATE</th>
                <th>LOCATION</th>
                <th>CAPACITY</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredEvents().length > 0 ? (
                getFilteredEvents().map((event) => (
                  <tr key={event.id}>
                    <td className="event-name-cell">
                      <div className="event-name">{event.name}</div>
                      <div className="event-type">{event.type}</div>
                    </td>
                    <td>
                      <div className="event-date">
                        <FaCalendarAlt className="icon" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="event-location">
                        <FaMapMarkerAlt className="icon" />
                        <span>{event.location}</span>
                      </div>
                    </td>
                    <td>
                      <div className="event-capacity">
                        <FaUsers className="icon" />
                        <span>{event.capacity}</span>
                      </div>
                    </td>
                    <td>
                      <div className="event-status">
                        <div className={`activity-status ${event.status.toLowerCase()}`}>
                          {event.status}
                        </div>
                        {event.timelineReviewDeadline && (
                          <div className="event-due-date">
                            <FaClock className="icon" />
                            <span>Due {formatDate(event.timelineReviewDeadline)}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="event-actions">
                      <button className="event-button view-button" onClick={() => handleViewEvent(event.id)}>
                        <FaEye />
                      </button>
                        <button className="event-button edit-button" onClick={() => openEditModal(event)}>
                          <FaEdit />
                        </button>
                        <button 
                          className="event-button delete-button"
                          onClick={() => openDeleteConfirm(event)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-events-message">
                    No events found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 模态框保持不变 */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-container create-modal">
            <CreateNewEvent 
              onClose={() => setShowCreateModal(false)}
              onEventCreated={handleEventCreated}
            />
          </div>
        </div>
      )}

      {showEditModal && currentEvent && (
        <div className="modal-overlay">
          <div className="modal-container edit-modal">
            <h3>Edit Event</h3>
            <div className="edit-form">
              <div className="form-group">
                <label>Event Name</label>
                <input
                  type="text"
                  name="name"
                  value={currentEvent.name}
                  onChange={handleEditChange}
                />
              </div>
              
              <div className="form-group">
                <label>Event Type</label>
                <input
                  type="text"
                  name="type"
                  value={currentEvent.type}
                  onChange={handleEditChange}
                />
              </div>
              
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  name="date"
                  value={currentEvent.date ? currentEvent.date.split('T')[0] : ''}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  name="timelineReviewDeadline"
                  value={currentEvent.timelineReviewDeadline ? currentEvent.timelineReviewDeadline.split('T')[0] : ''}
                  onChange={handleEditChange}
                />
              </div>
              
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={currentEvent.location}
                  onChange={handleEditChange}
                />
              </div>
              
              <div className="form-group">
                <label>Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={currentEvent.capacity}
                  onChange={handleEditChange}
                />
              </div>
              
              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={currentEvent.status}
                  onChange={handleEditChange}
                >
                  <option value="Planning">Planning</option>
                  <option value="ListGeneration">List Generation</option>
                  <option value="Review">Review</option>
                  <option value="Ready">Ready</option>
                  <option value="Complete">Complete</option>
                </select>
              </div>
            </div>
            <div className="modal-buttons">
              <button className="cancel-button" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="save-button" onClick={saveEvent}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && eventToDelete && (
        <div className="modal-overlay">
          <div className="modal-container delete-modal">
            <h3>Delete Event</h3>
            <p>Are you sure you want to delete the event "{eventToDelete.name}"?</p>
            <p className="warning-text">This action cannot be undone.</p>
            <div className="modal-buttons">
              <button className="cancel-button" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="modal-delete-button" onClick={handleDeleteEvent}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManagement;