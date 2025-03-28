import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaClock, FaFilter, FaSearch } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import './EventManagement.css';
import eventAPI from '../../services/eventAPI.js';
import authService from '../../services/authService.js';
import CreateNewEvent from './CreateNewEvent.jsx';

const EventManagement = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      if (authService.isAuthenticated()) {
        console.log('Token exists:', localStorage.getItem('token'));
        const eventsData = await eventAPI.getEvents();
        console.log('Events fetched successfully:', eventsData); 
        if (eventsData && eventsData.events) {
          setEvents(eventsData.events);
          setOriginalEvents(eventsData.events); 
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

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [typesData, locationsData] = await Promise.all([
          eventAPI.getEventTypes(),
          eventAPI.getEventLocations()
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

  // Handle search
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setEvents(originalEvents);
      return;
    }
    const filteredEvents = originalEvents.filter(event => 
      event.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setEvents(filteredEvents);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Format date display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Filter events based on active tab
  const getFilteredEvents = () => {
    if (activeTab === 'upcoming') {
      return events;
    } else if (activeTab === 'past') {
      return [];
    } else {
      return events;
    }
  };

  // UPDATED: Show create event modal instead of navigation
  const handleCreateEvent = () => {
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleEventCreated = async () => {
    setShowCreateModal(false);
    // Refresh events list
    await fetchEvents();
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
      if (searchQuery) filterParams.search = searchQuery;
      console.log('Applying filters with params:', filterParams);
      const eventsData = await eventAPI.getEvents(filterParams);
      if (eventsData && eventsData.events) {
        setEvents(eventsData.events);
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
            <button className="search-button" onClick={handleSearch}>
              Search
            </button>
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
            <select name="type" value={filters.type} onChange={handleFilterChange}>
              <option value="">All Types</option>
              {eventTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label>Location</label>
            <select name="location" value={filters.location} onChange={handleFilterChange}>
              <option value="">All Locations</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label>Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange}>
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
            <select name="dateRange" value={filters.dateRange} onChange={handleFilterChange}>
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
                getFilteredEvents().map(event => (
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
                      <div className="event-actions" onClick={() => handleViewEvent(event.id)}>
                        <button className="event-action-button">View</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-events-message">No events found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <CreateNewEvent 
              onClose={handleCloseCreateModal}
              onEventCreated={handleEventCreated}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManagement;
