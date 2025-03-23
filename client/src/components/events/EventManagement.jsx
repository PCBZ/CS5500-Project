import React, { useState } from 'react';
import './EventManagement.css';
import DonorCard from './DonorCard.jsx';
import EventDetails from './EventDetails.jsx';

const EventManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sample data for the donor cards
  const donors = [
    {
      id: 1,
      name: 'John Smith',
      priority: 'High Priority',
      interests: ['Cancer Research Interest'],
      relationships: 'Smith Corp. Smith Family Foundation',
      previousEvents: ['Gala 2024', 'Research Symposium 2024'],
      type: 'individual'
    },
    {
      id: 2,
      name: 'Smith Corporation',
      type: 'Corporate',
      flag: 'Never Invite - Link to Individual',
      relationships: 'John Smith',
      autoExcluded: true
    },
    {
      id: 3,
      name: 'Emily Johnson',
      interests: ['Patient Care Interest'],
      previousEvents: ['Patient Care Roundape 2023'],
      type: 'individual'
    }
  ];
  
  // Event statistics
  const stats = {
    pending: 45,
    approved: 28,
    excluded: 12
  };
  
  // Event details
  const eventDetails = {
    name: 'Spring Gala 2025',
    type: 'Major Donor Event',
    date: 'March 15, 2025',
    location: 'Vancouver Convention Center',
    capacity: '200 attendees',
    reviewDeadline: 'Feb 20, 2025'
  };
  
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="event-management-container">
      <div className="event-management-header">
        <div className="header-left">
          <h1>Event Management</h1>
          <p>Plan, organize and track fundraising events</p>
        </div>
        <div className="header-right">
          <button className="create-event-btn">Create New Event</button>
        </div>
      </div>
      
      <div className="event-management-content">
        <div className="search-filter-container">
          <input 
            type="text" 
            placeholder="Search Events" 
            className="search-input"
            value={searchQuery}
            onChange={handleSearch}
          />
          <button className="filter-btn">
            <i className="filter-icon"></i>
            Filters
          </button>
        </div>
        
        <div className="event-stats">
          <div className="stat-box">
            <h2>{stats.pending}</h2>
            <p>Pending Review</p>
          </div>
          <div className="stat-box">
            <h2>{stats.approved}</h2>
            <p>Approved</p>
          </div>
          <div className="stat-box">
            <h2>{stats.excluded}</h2>
            <p>Excluded</p>
          </div>
        </div>
        
        <div className="donors-list">
          {donors.map(donor => (
            <DonorCard key={donor.id} donor={donor} />
          ))}
        </div>
        
        <EventDetails event={eventDetails} />
      </div>
    </div>
  );
};

export default EventManagement; 