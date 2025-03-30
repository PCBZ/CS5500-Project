import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaClock, FaTrash, FaFilter, FaSearch, FaEdit } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import './EventManagement.css';
import { getEvents, updateEvent, deleteEvent, getEventTypes, getEventLocations } from '../../services/eventService';
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
    dateRange: ''
  });

  const [eventTypes, setEventTypes] = useState([]);
  const [locations, setLocations] = useState([]);
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

    const fetchFilterOptions = async () => {
      try {
        const [typesData, locationsData] = await Promise.all([
          getEventTypes(),
          getEventLocations()
        ]);

        setEventTypes(typesData);
        setLocations(locationsData);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };

    fetchEvents();
    fetchFilterOptions();
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
      if (filters.location) filterParams.location = filters.location;
      if (filters.type) filterParams.type = filters.type;
      
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
        console.warn('No events found with the applied filters');
      }
    } catch (error) {
      console.error('Error applying filters:', error);
      setError(error.message || 'Failed to filter events');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="event-management-container">
      <header className="event-management-header">
        <div>
          <h1>Event Management</h1>
          <p>Plan, organize and track fundraising events</p>
        </div>
        <button className="create-event-button" onClick={handleCreateEvent}>
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
          <div className="filter-item">
            <label>Event Type</label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
            >
              <option value="">All Types</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Location</label>
            <select
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
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
            </select>
          </div>

          <button className="apply-filters-button" onClick={applyFilters}>
            Apply Filters
          </button>
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
                          <button className="event-action-button" onClick={() => handleViewEvent(event.id)}>View</button>
                          <button className="event-action-button edit" onClick={() => openEditModal(event)}>
                            <FaEdit /> Edit
                          </button>
                          <button className="event-action-button delete" onClick={() => openDeleteConfirm(event)}>
                            <FaTrash /> Delete
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

      {/* Create New Event Modal */}
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

      {/* Edit Event Modal */}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && eventToDelete && (
        <div className="modal-overlay">
          <div className="modal-container delete-modal">
            <h3>Delete Event</h3>
            <p>Are you sure you want to delete the event "{eventToDelete.name}"?</p>
            <p className="warning-text">This action cannot be undone.</p>
            <div className="modal-buttons">
              <button className="cancel-button" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="delete-button" onClick={handleDeleteEvent}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EventManagement;
