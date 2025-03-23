import React, { useState, useEffect } from 'react';
import { FaUser, FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaClock, FaPlus, FaTrash, FaAngleDown } from 'react-icons/fa';
import './Donors.css';

const Donors = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [availableDonors, setAvailableDonors] = useState([]);
  const [showAddDonorModal, setShowAddDonorModal] = useState(false);
  
  // Mock events data
  const events = [
    {
      id: 1,
      name: 'Spring Gala 2025',
      type: 'Major Donor Event',
      date: 'March 15, 2025',
      location: 'Vancouver Convention Center',
      capacity: '200 attendees',
      reviewDeadline: 'Feb 20, 2025'
    },
    {
      id: 2,
      name: 'Research Symposium 2025',
      type: 'Scientific Event',
      date: 'April 22, 2025',
      location: 'BC Cancer Research Center',
      capacity: '150 attendees',
      reviewDeadline: 'March 30, 2025'
    },
    {
      id: 3,
      name: 'Patient Care Fundraiser',
      type: 'Community Event',
      date: 'May 10, 2025',
      location: 'Stanley Park',
      capacity: '300 attendees',
      reviewDeadline: 'April 15, 2025'
    }
  ];

  // Mock donor data for events
  const eventDonorsMap = {
    1: [
      {
        id: 1,
        name: 'John Smith',
        priority: 'High Priority',
        interests: ['Cancer Research Interest'],
        relationships: 'Smith Corp. Smith Family Foundation',
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
        previousEvents: ['Patient Care Roundtable 2023'],
        status: 'approved'
      }
    ],
    2: [
      {
        id: 4,
        name: 'Dr. Sarah Williams',
        priority: 'VIP',
        interests: ['Cancer Research Interest', 'Medical Innovation'],
        previousEvents: ['Research Symposium 2024'],
        status: 'approved'
      },
      {
        id: 5,
        name: 'Medical Innovations Ltd',
        type: 'Corporate',
        interests: ['Research Funding'],
        status: 'pending'
      }
    ],
    3: [
      {
        id: 6,
        name: 'Community Health Partners',
        type: 'Corporate',
        interests: ['Patient Support'],
        status: 'approved'
      },
      {
        id: 7,
        name: 'Maria Garcia',
        interests: ['Patient Care Interest', 'Community Outreach'],
        previousEvents: ['Patient Care Roundtable 2023'],
        status: 'pending'
      }
    ]
  };

  // Available donors to add (not in the current event)
  const allPotentialDonors = [
    {
      id: 8,
      name: 'Robert Johnson',
      priority: 'Medium Priority',
      interests: ['Cancer Research Interest'],
      previousEvents: ['Gala 2023']
    },
    {
      id: 9,
      name: 'Tech Innovations Inc',
      type: 'Corporate',
      interests: ['Medical Technology']
    },
    {
      id: 10,
      name: 'Lisa Chen',
      priority: 'High Priority',
      interests: ['Patient Care', 'Education']
    }
  ];

  // Statistics data for each event
  const eventStatsMap = {
    1: { pending: 45, approved: 28, excluded: 12 },
    2: { pending: 32, approved: 18, excluded: 5 },
    3: { pending: 21, approved: 35, excluded: 8 }
  };

  // Set default selected event on component mount
  useEffect(() => {
    if (events.length > 0 && !selectedEvent) {
      setSelectedEvent(events[0]);
      
      // Initialize available donors
      updateAvailableDonors(events[0].id);
    }
  }, []);

  // Update available donors when event changes
  const updateAvailableDonors = (eventId) => {
    const currentEventDonorIds = eventDonorsMap[eventId]?.map(donor => donor.id) || [];
    const donorsToAdd = allPotentialDonors.filter(donor => !currentEventDonorIds.includes(donor.id));
    setAvailableDonors(donorsToAdd);
  };

  // Get current donors based on selected event
  const getCurrentDonors = () => {
    return selectedEvent ? (eventDonorsMap[selectedEvent.id] || []) : [];
  };

  // Get stats for current event
  const getCurrentStats = () => {
    return selectedEvent ? (eventStatsMap[selectedEvent.id] || { pending: 0, approved: 0, excluded: 0 }) : { pending: 0, approved: 0, excluded: 0 };
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

  // Handle event selection
  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    setShowEventDropdown(false);
    updateAvailableDonors(event.id);
  };

  // Handle adding donor to event
  const handleAddDonor = (donor) => {
    if (!selectedEvent) return;
    
    // Add donor to current event (in a real app, this would be an API call)
    const currentEventId = selectedEvent.id;
    const updatedDonors = [...getCurrentDonors(), { ...donor, status: 'pending' }];
    
    // Update mock data (in a real app, this would update after the API response)
    eventDonorsMap[currentEventId] = updatedDonors;
    
    // Update available donors
    updateAvailableDonors(currentEventId);
    
    // Close modal
    setShowAddDonorModal(false);
  };

  // Handle removing donor from event
  const handleRemoveDonor = (donorId) => {
    if (!selectedEvent) return;
    
    if (window.confirm('Are you sure you want to remove this donor from the event?')) {
      const currentEventId = selectedEvent.id;
      const updatedDonors = getCurrentDonors().filter(donor => donor.id !== donorId);
      
      // Update mock data (in a real app, this would be an API call)
      eventDonorsMap[currentEventId] = updatedDonors;
      
      // Update stats - decrement the appropriate counter
      const donorToRemove = getCurrentDonors().find(donor => donor.id === donorId);
      if (donorToRemove) {
        const statsKey = donorToRemove.status === 'approved' ? 'approved' : 
                         donorToRemove.status === 'excluded' ? 'excluded' : 'pending';
        eventStatsMap[currentEventId][statsKey] -= 1;
      }
      
      // Update available donors
      updateAvailableDonors(currentEventId);
    }
  };

  // Filter donors based on search query
  const filteredDonors = getCurrentDonors().filter(donor => 
    donor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get current stats
  const stats = getCurrentStats();

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
              <div className="event-selector">
                <div 
                  className="selected-event" 
                  onClick={() => setShowEventDropdown(!showEventDropdown)}
                >
                  <span>Donor Review List: {selectedEvent ? selectedEvent.name : 'Select Event'}</span>
                  <FaAngleDown className="dropdown-icon" />
                </div>
                {showEventDropdown && (
                  <div className="event-dropdown">
                    {events.map(event => (
                      <div 
                        key={event.id} 
                        className={`event-option ${selectedEvent && selectedEvent.id === event.id ? 'active' : ''}`}
                        onClick={() => handleEventSelect(event)}
                      >
                        {event.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="donor-actions">
              <div className="donor-search">
                <input
                  type="text"
                  placeholder="Search donors"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
              <button 
                className="add-donor-button"
                onClick={() => setShowAddDonorModal(true)}
              >
                <FaPlus /> Add Donor
              </button>
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
            {filteredDonors.map(donor => (
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
                  <button 
                    className="remove-donor-button"
                    onClick={() => handleRemoveDonor(donor.id)}
                    title="Remove from event"
                  >
                    <FaTrash />
                  </button>
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

            {filteredDonors.length === 0 && (
              <div className="no-donors">
                <p>No donors found for this event. Use the "Add Donor" button to add donors.</p>
              </div>
            )}
          </div>

          <div className="donor-pagination">
            <div className="pagination-info">
              Showing {filteredDonors.length > 0 ? `1-${Math.min(filteredDonors.length, 10)} of ${filteredDonors.length}` : '0'} donors
            </div>
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
            {selectedEvent ? (
              <>
                <h3>{selectedEvent.name}</h3>
                <p className="event-type">{selectedEvent.type}</p>
                
                <div className="event-detail-item">
                  <FaCalendarAlt className="icon" />
                  <span>{selectedEvent.date}</span>
                </div>
                
                <div className="event-detail-item">
                  <FaMapMarkerAlt className="icon" />
                  <span>{selectedEvent.location}</span>
                </div>
                
                <div className="event-detail-item">
                  <FaUsers className="icon" />
                  <span>Capacity: {selectedEvent.capacity}</span>
                </div>
                
                <div className="event-detail-item">
                  <FaClock className="icon" />
                  <span>Review deadline: {selectedEvent.reviewDeadline}</span>
                </div>
              </>
            ) : (
              <p>Please select an event</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Donor Modal */}
      {showAddDonorModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add Donor to {selectedEvent?.name}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowAddDonorModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>Select a donor to add to this event:</p>
              <div className="available-donors-list">
                {availableDonors.length > 0 ? (
                  availableDonors.map(donor => (
                    <div key={donor.id} className="available-donor-item">
                      <div className="available-donor-info">
                        <h4>{donor.name}</h4>
                        <div className="available-donor-tags">
                          {donor.type && <span className="tag type-tag">{donor.type}</span>}
                          {donor.priority && <span className="tag priority-tag">{donor.priority}</span>}
                        </div>
                      </div>
                      <button 
                        className="add-this-donor-button"
                        onClick={() => handleAddDonor(donor)}
                      >
                        <FaPlus /> Add
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="no-available-donors">No more donors available to add.</p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-cancel"
                onClick={() => setShowAddDonorModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Donors; 