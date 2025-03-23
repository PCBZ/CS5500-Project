import React, { useState } from 'react';
import { FaUser, FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaClock } from 'react-icons/fa';
import './Donors.css';

const Donors = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Mock donor data
  const donors = [
    {
      id: 1,
      name: 'John Smith',
      priority: 'High Priority',
      interests: ['Cancer Reasearch Interest'],
      relationships: 'Smith Corp. Smith Family Fioundation',
      previousEvents: ['Gala 2024', 'Research Symposium 2024'],
      status: 'approved'
    },
    {
      id: 2,
      name: 'Smith Corporation',
      type: 'Corporate',
      relationships: 'John Smith',
      flags: ['Never Invite - Link to Individual'],
      autoExcluded: true,
      status: 'excluded'
    },
    {
      id: 3,
      name: 'Emily Johnson',
      interests: ['Patient Care Interest'],
      previousEvents: ['Patient Care Roundape 2023'],
      status: 'approved'
    }
  ];

  // Statistics data
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

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle export list
  const handleExport = () => {
    alert('Export functionality will be implemented here');
  };

  return (
    <div className="donors-container">
      <header className="donors-header">
        <div>
          <h1>Donor Management</h1>
          <p>Review and manage donor lists for upcoming events</p>
        </div>
        <button className="export-button" onClick={handleExport}>
          Export List
        </button>
      </header>

      <div className="donors-content">
        <div className="donor-list-container">
          <div className="donor-list-header">
            <div className="donor-list-title">
              <FaUser className="icon" />
              <span>Donor Review List: Spring Gala 2025</span>
            </div>
            <div className="donor-search">
              <input
                type="text"
                placeholder="Search donors"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </div>

          <div className="donor-stats">
            <div className="stat-item pending">
              <div className="stat-number">{stats.pending}</div>
              <div className="stat-label">Pending Review</div>
            </div>
            <div className="stat-item approved">
              <div className="stat-number">{stats.approved}</div>
              <div className="stat-label">Approved</div>
            </div>
            <div className="stat-item excluded">
              <div className="stat-number">{stats.excluded}</div>
              <div className="stat-label">Excluded</div>
            </div>
          </div>

          <div className="donor-cards">
            {donors.map(donor => (
              <div key={donor.id} className={`donor-card ${donor.autoExcluded ? 'auto-excluded' : ''}`}>
                <div className="donor-card-header">
                  <h3>{donor.name}</h3>
                  {donor.status === 'approved' && (
                    <div className="approval-icon">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="#10B981" />
                        <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="donor-tags">
                  {donor.priority && <span className="tag priority-tag">{donor.priority}</span>}
                  {donor.type && <span className="tag type-tag">{donor.type}</span>}
                  {donor.interests && donor.interests.map((interest, index) => (
                    <span key={index} className="tag interest-tag">{interest}</span>
                  ))}
                  {donor.autoExcluded && <span className="tag excluded-tag">Auto-Excluded</span>}
                  {donor.flags && donor.flags.map((flag, index) => (
                    <span key={index} className="tag flag-tag">{flag}</span>
                  ))}
                </div>
                
                {donor.relationships && (
                  <div className="donor-relationships">
                    <span>Relationships: {donor.relationships}</span>
                  </div>
                )}
                
                {donor.previousEvents && donor.previousEvents.length > 0 && (
                  <div className="donor-previous-events">
                    <span>Previous Events: {donor.previousEvents.join(', ')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="donor-pagination">
            <div className="pagination-info">Showing 1-3 of 85 donors</div>
            <div className="pagination-controls">
              <button 
                className="pagination-button" 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Previous
              </button>
              <button className={`pagination-button ${currentPage === 1 ? 'active' : ''}`} onClick={() => handlePageChange(1)}>1</button>
              <button className={`pagination-button ${currentPage === 2 ? 'active' : ''}`} onClick={() => handlePageChange(2)}>2</button>
              <button className={`pagination-button ${currentPage === 3 ? 'active' : ''}`} onClick={() => handlePageChange(3)}>3</button>
              <button 
                className="pagination-button" 
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="donor-details-container">
          <div className="event-details">
            <h2><FaCalendarAlt className="icon" /> Event Details</h2>
            <h3>{eventDetails.name}</h3>
            <p className="event-type">{eventDetails.type}</p>
            
            <div className="event-detail-item">
              <FaCalendarAlt className="icon" />
              <span>{eventDetails.date}</span>
            </div>
            
            <div className="event-detail-item">
              <FaMapMarkerAlt className="icon" />
              <span>{eventDetails.location}</span>
            </div>
            
            <div className="event-detail-item">
              <FaUsers className="icon" />
              <span>Capacity: {eventDetails.capacity}</span>
            </div>
            
            <div className="event-detail-item">
              <FaClock className="icon" />
              <span>Review deadline: {eventDetails.reviewDeadline}</span>
            </div>
          </div>

          <div className="smart-filters">
            <h2>Smart Filters</h2>
            {/* Filter section can be added later */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Donors; 