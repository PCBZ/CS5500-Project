import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaClock, FaTrash, FaFilter, FaSearch, FaEdit, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './EventManagement.css';
import '../../styles/common.css';
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
  const navigate = useNavigate();

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

  // Add a new state for date validation errors
  const [dateValidationError, setDateValidationError] = useState(null);

  const openEditModal = (event) => {
    setCurrentEvent({ ...event });
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
      // Added notification for event editing:
      setSuccess('Event saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
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
      // Added notification for event deletion:
      setSuccess('Event deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting event:', error);
      setError(error.message || 'Failed to delete event');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    // Create updated filters object
    const updatedFilters = {
      ...filters,
      [name]: value
    };
    
    // Handle date validation for custom date range
    if (name === 'customStartDate' || name === 'customEndDate') {
      // If setting start date, check against end date if it exists
      if (name === 'customStartDate' && updatedFilters.customEndDate && 
          value > updatedFilters.customEndDate) {
        setDateValidationError('Start date cannot be later than end date');
        setTimeout(() => setDateValidationError(null), 3000);
        return; // Don't update if invalid
      }
      
      // If setting end date, check against start date if it exists
      if (name === 'customEndDate' && updatedFilters.customStartDate && 
          updatedFilters.customStartDate > value) {
        setDateValidationError('End date cannot be earlier than start date');
        setTimeout(() => setDateValidationError(null), 3000);
        return; // Don't update if invalid
      }
    }
    
    // If validation passes, update the filters
    setFilters(updatedFilters);
    
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
    navigate('/donors', { state: { selectedEventId: eventId } });
  };

  const handleCreateEvent = () => {
    setShowCreateModal(true);
  };

  const handleEventCreated = (newEvent) => {
    if (!newEvent || !newEvent.data) {
      console.error('Invalid event data received:', newEvent);
      return;
    }

    const eventData = newEvent.data;
    
    setEvents(prevEvents => [...prevEvents, eventData]);
    setOriginalEvents(prevEvents => [...prevEvents, eventData]);
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
                {dateValidationError && (
                  <div className="date-validation-error" style={{
                    color: '#f44336',
                    fontSize: '14px',
                    marginTop: '5px'
                  }}>
                    {dateValidationError}
                  </div>
                )}
              </div>
            )}
          </div>

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

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

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
                getFilteredEvents().map((event, index) => (
                  <tr key={event?.id ? event.id : `event-${index}`}>
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