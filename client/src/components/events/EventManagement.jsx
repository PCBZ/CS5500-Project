import React, { useState } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaClock, FaFilter, FaSearch } from 'react-icons/fa';
import './EventManagement.css';

const EventManagement = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock event data
  const events = [
    {
      id: 1,
      name: 'Spring Gala 2025',
      type: 'Major Donor event',
      date: 'March 15, 2025',
      location: 'Vancouver',
      capacity: 200,
      status: 'PMM Review 3/5',
      dueDate: 'Feb 20'
    },
    {
      id: 2,
      name: 'Research Symposium 2025',
      type: 'Research Event',
      date: 'May 20, 2025',
      location: 'Victoria',
      capacity: 50,
      status: 'Planning'
    },
    {
      id: 3,
      name: 'Donor Appreciation Event',
      type: 'Cultural Event',
      date: 'June 10, 2025',
      location: 'Vancouver',
      capacity: 100,
      status: 'Ready for invitations'
    }
  ];
  
  // Handle search
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filter events based on active tab
  const getFilteredEvents = () => {
    // In a real app, you would filter based on date compared to current date
    if (activeTab === 'upcoming') {
      return events;
    } else if (activeTab === 'past') {
      return [];
    } else {
      return events;
    }
  };

  // Handle create new event
  const handleCreateEvent = () => {
    alert('Create new event functionality will be implemented here');
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
            />
          </div>
          
          <button className="filter-button">
            <FaFilter className="filter-icon" />
            <span>Filters</span>
          </button>
        </div>
      </div>

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
            {getFilteredEvents().map(event => (
              <tr key={event.id}>
                <td className="event-name-cell">
                  <div className="event-name">{event.name}</div>
                  <div className="event-type">{event.type}</div>
                </td>
                <td>
                  <div className="event-date">
                    <FaCalendarAlt className="icon" />
                    <span>{event.date}</span>
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
                    {event.status}
                    {event.dueDate && (
                      <div className="event-due-date">
                        <FaClock className="icon" />
                        <span>Due {event.dueDate}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="event-actions">
                    <button className="event-action-button">View</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventManagement; 