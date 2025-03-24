import React, { useState, useEffect } from 'react';
import { FaUser, FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaClock, FaPlus, FaTrash, FaAngleDown, FaSpinner } from 'react-icons/fa';
import { getEvents, getEventById, getEventDonors } from '../../services/eventService';
import { getAvailableDonors, addDonorToEvent, removeDonorFromEvent, getEventDonorStats } from '../../services/donorService';
import './Donors.css';

// Temporary workaround to ensure mock data works without authentication
// REMOVE THIS FOR PRODUCTION
const setupMockToken = () => {
  if (!localStorage.getItem('token')) {
    console.warn('Setting temporary mock token for development');
    localStorage.setItem('token', 'mock-token-for-development-only');
  }
};

const Donors = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [availableDonors, setAvailableDonors] = useState([]);
  const [showAddDonorModal, setShowAddDonorModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventDonors, setEventDonors] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, excluded: 0 });
  const [loading, setLoading] = useState({
    events: false,
    donors: false,
    stats: false,
    availableDonors: false
  });
  const [error, setError] = useState({
    events: null,
    donors: null,
    stats: null,
    availableDonors: null
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalDonors, setTotalDonors] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Set up mock token for development
  useEffect(() => {
    setupMockToken();
  }, []);

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Fetch donors when selected event changes or search/page changes
  useEffect(() => {
    if (selectedEvent) {
      fetchEventDonors();
      fetchEventStats();
    }
  }, [selectedEvent, searchQuery, currentPage]);

  // Fetch events
  const fetchEvents = async () => {
    setLoading(prev => ({ ...prev, events: true }));
    setError(prev => ({ ...prev, events: null }));

    try {
      const response = await getEvents({ status: 'active' });
      setEvents(response.data || []);

      // Set default selected event
      if (response.data && response.data.length > 0 && !selectedEvent) {
        setSelectedEvent(response.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError(prev => ({ ...prev, events: 'Failed to load events' }));
    } finally {
      setLoading(prev => ({ ...prev, events: false }));
    }
  };

  // Fetch donors for selected event
  const fetchEventDonors = async () => {
    if (!selectedEvent) return;

    setLoading(prev => ({ ...prev, donors: true }));
    setError(prev => ({ ...prev, donors: null }));

    try {
      const response = await getEventDonors(selectedEvent.id, {
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined
      });

      setEventDonors(response.data || []);
      setTotalPages(response.total_pages || 1);
      setTotalDonors(response.total_count || 0);
    } catch (err) {
      console.error('Failed to fetch event donors:', err);
      setError(prev => ({ ...prev, donors: 'Failed to load donors' }));
    } finally {
      setLoading(prev => ({ ...prev, donors: false }));
    }
  };

  // Fetch event statistics
  const fetchEventStats = async () => {
    if (!selectedEvent) return;

    setLoading(prev => ({ ...prev, stats: true }));
    setError(prev => ({ ...prev, stats: null }));

    try {
      const response = await getEventDonorStats(selectedEvent.id);
      setStats({
        pending: response.pending_review || 0,
        approved: response.approved || 0,
        excluded: response.excluded || 0
      });
    } catch (err) {
      console.error('Failed to fetch event stats:', err);
      setError(prev => ({ ...prev, stats: 'Failed to load statistics' }));
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  /**
   * Open the add donor modal
   */
  const handleOpenAddDonorModal = async () => {
    if (!selectedEvent) return;
    
    try {
      setLoading(prev => ({ ...prev, availableDonors: true }));
      setError(prev => ({ ...prev, availableDonors: null }));
      
      // Get available donors using the service function that now properly filters
      // donors not already in the event
      const result = await getAvailableDonors(selectedEvent.id, {
        page: 1,
        limit: 100,
        search: searchQuery || ''
      });
      
      setAvailableDonors(result.data || []);
      setShowAddDonorModal(true);
    } catch (error) {
      console.error('Error fetching available donors:', error);
      setError(prev => ({ ...prev, availableDonors: 'Failed to fetch available donors, please try again' }));
    } finally {
      setLoading(prev => ({ ...prev, availableDonors: false }));
    }
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    
    // If in modal, refresh available donors with search term
    if (showAddDonorModal) {
      handleOpenAddDonorModal();
    } else {
      setCurrentPage(1); // Reset to first page on search
    }
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowAddDonorModal(false);
    // Reset search query if it was used in modal
    if (searchQuery) {
      setSearchQuery('');
    }
  };

  // Handle pagination
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
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
    setCurrentPage(1); // Reset to first page when changing events
    setSearchQuery(''); // Clear search when changing events
  };

  /**
   * Add a donor to the currently selected event
   * @param {number} donorId - The ID of the donor to add
   */
  const handleAddDonor = async (donorId) => {
    if (!selectedEvent || !donorId) return;

    try {
      setLoading(prev => ({ ...prev, donors: true }));
      
      // Call API to add donor to event
      await addDonorToEvent(selectedEvent.id, donorId);
      
      // Update data
      fetchEventDonors();
      fetchEventStats();
      
      // Remove this donor from the available donors list
      setAvailableDonors(prev => prev.filter(donor => donor.id !== donorId));
      
      // Show success message (optional)
      // toast.success('Donor added successfully');
    } catch (error) {
      console.error('Error adding donor to event:', error);
      setError(prev => ({ ...prev, donors: 'Failed to add donor, please try again' }));
    } finally {
      setLoading(prev => ({ ...prev, donors: false }));
    }
  };

  /**
   * Remove a donor from the currently selected event
   * @param {number} donorId - The ID of the donor to remove
   */
  const handleRemoveDonor = async (donorId) => {
    if (!selectedEvent || !donorId) return;
    
    // Confirm before removing donor
    if (!window.confirm('Are you sure you want to remove this donor from the event?')) {
      return;
    }

    try {
      setLoading(prev => ({ ...prev, donors: true }));
      
      // Call API to remove donor from event
      await removeDonorFromEvent(selectedEvent.id, donorId);
      
      // Update data
      fetchEventDonors();
      fetchEventStats();
      
      // Show success message (optional)
      // toast.success('Donor removed successfully');
    } catch (error) {
      console.error('Error removing donor from event:', error);
      setError(prev => ({ ...prev, donors: 'Failed to remove donor, please try again' }));
    } finally {
      setLoading(prev => ({ ...prev, donors: false }));
    }
  };

  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Generate pagination array
  const generatePaginationArray = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are 5 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Add pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Always include last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="donors-container">
      <header className="donors-header">
        <div>
          <h1>Donor Management</h1>
          <p>View and manage donor lists for upcoming events</p>
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
                  <span>Donor List: {selectedEvent ? selectedEvent.name : 'Select Event'}</span>
                  <FaAngleDown className="dropdown-icon" />
                </div>
                {showEventDropdown && (
                  <div className="event-dropdown">
                    {loading.events ? (
                      <div className="loading-indicator">
                        <FaSpinner className="spinner" /> Loading events...
                      </div>
                    ) : error.events ? (
                      <div className="error-message">
                        {error.events}
                        <button onClick={fetchEvents} className="retry-button-small">Retry</button>
                      </div>
                    ) : events.length === 0 ? (
                      <div className="no-data-message">No events found</div>
                    ) : (
                      events.map(event => (
                        <div 
                          key={event.id} 
                          className={`event-option ${selectedEvent && selectedEvent.id === event.id ? 'active' : ''}`}
                          onClick={() => handleEventSelect(event)}
                        >
                          {event.name}
                        </div>
                      ))
                    )}
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
                onClick={handleOpenAddDonorModal}
                disabled={!selectedEvent}
              >
                <FaPlus /> Add Donor
              </button>
            </div>
          </div>

          <div className="donor-stats">
            {loading.stats ? (
              <div className="stats-loading">
                <FaSpinner className="spinner" /> Loading stats...
              </div>
            ) : error.stats ? (
              <div className="stats-error">
                {error.stats}
                <button onClick={fetchEventStats} className="retry-button-small">Retry</button>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>

          <div className="donors-main-content">
            {loading.donors && (
              <div className="loading-indicator donors-loading">
                <FaSpinner className="spinner" />
                <p>Loading donor data...</p>
              </div>
            )}
            
            {error.donors && (
              <div className="error-message">
                <p>{error.donors}</p>
                <button onClick={fetchEventDonors}>Retry</button>
              </div>
            )}
            
            {!loading.donors && !error.donors && (
              <>
                {eventDonors.length === 0 ? (
                  <div className="no-donors-message">
                    <p>No donors found for this event. Click the "Add Donor" button to add donors.</p>
                  </div>
                ) : (
                  <div className="donors-grid">
                    {eventDonors.map(donor => (
                      <div key={donor.id} className="donor-card">
                        <div className="donor-card-header">
                          <FaUser className="donor-icon" />
                          <h3>{donor.first_name} {donor.last_name}</h3>
                          <button 
                            className="remove-donor-button"
                            onClick={() => handleRemoveDonor(donor.id)}
                            disabled={loading.donors}
                            title="Remove this donor from the event"
                          >
                            <FaTrash />
                          </button>
                        </div>
                        <div className="donor-card-body">
                          <p><strong>Type:</strong> {donor.type}</p>
                          <p><strong>Priority:</strong> {donor.priority}</p>
                          {donor.tags && donor.tags.length > 0 && (
                            <div className="donor-flags">
                              {donor.tags.map((tag, index) => (
                                <span key={index} className="donor-flag">{tag}</span>
                              ))}
                            </div>
                          )}
                          {donor.status && (
                            <p className={`donor-status ${donor.status}`}>
                              <strong>Status:</strong> {donor.status}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {!loading.donors && !error.donors && eventDonors.length > 0 && (
            <div className="donor-pagination">
              <div className="pagination-info">
                Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalDonors)} of {totalDonors} donors
              </div>
              <div className="pagination-controls">
                <button 
                  className="pagination-button" 
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Previous
                </button>
                
                {generatePaginationArray().map((page, index) => (
                  typeof page === 'number' ? (
                    <button 
                      key={index}
                      className={`pagination-button ${currentPage === page ? 'active' : ''}`} 
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  ) : (
                    <span key={index} className="pagination-ellipsis">{page}</span>
                  )
                ))}
                
                <button 
                  className="pagination-button" 
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="donor-details-container">
          <div className="event-details">
            <h2><FaCalendarAlt className="icon" /> Event Details</h2>
            {loading.events ? (
              <div className="event-details-loading">
                <FaSpinner className="spinner" /> Loading event details...
              </div>
            ) : error.events ? (
              <div className="event-details-error">
                {error.events}
                <button onClick={fetchEvents} className="retry-button-small">Retry</button>
              </div>
            ) : !selectedEvent ? (
              <p>Please select an event</p>
            ) : (
              <>
                <h3>{selectedEvent.name}</h3>
                <p className="event-type">{selectedEvent.type}</p>
                
                <div className="event-detail-item">
                  <FaCalendarAlt className="icon" />
                  <span>{formatDate(selectedEvent.date)}</span>
                </div>
                
                <div className="event-detail-item">
                  <FaMapMarkerAlt className="icon" />
                  <span>{selectedEvent.location}</span>
                </div>
                
                <div className="event-detail-item">
                  <FaUsers className="icon" />
                  <span>Capacity: {selectedEvent.capacity || 'Not specified'}</span>
                </div>
                
                <div className="event-detail-item">
                  <FaClock className="icon" />
                  <span>Review deadline: {formatDate(selectedEvent.review_deadline)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Donor Modal */}
      {showAddDonorModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add Donor to {selectedEvent?.name}</h3>
            <div className="modal-close" onClick={handleCloseModal}>&times;</div>
            
            {loading.availableDonors && (
              <div className="loading-indicator">
                <FaSpinner className="spinner" />
                <p>Loading available donors...</p>
              </div>
            )}
            
            {error.availableDonors && (
              <div className="error-message">
                <p>{error.availableDonors}</p>
                <button onClick={handleOpenAddDonorModal}>Retry</button>
              </div>
            )}
            
            {!loading.availableDonors && !error.availableDonors && (
              <>
                <div className="modal-header-actions">
                  <input
                    type="text"
                    placeholder="Search available donors"
                    value={searchQuery}
                    onChange={handleSearch}
                    className="donor-search-input"
                  />
                  <button 
                    className="refresh-button"
                    onClick={handleOpenAddDonorModal}
                    disabled={loading.availableDonors}
                  >
                    Refresh List
                  </button>
                </div>
                
                {availableDonors.length === 0 ? (
                  <p>No donors available to add</p>
                ) : (
                  <div className="available-donors-list">
                    {availableDonors.map(donor => (
                      <div key={donor.id} className="available-donor-item">
                        <div>
                          <strong>{donor.first_name} {donor.last_name}</strong>
                          <p>{donor.type} - Priority: {donor.priority}</p>
                        </div>
                        <button 
                          className="add-donor-button" 
                          onClick={() => handleAddDonor(donor.id)}
                          disabled={loading.donors}
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            
            <div className="modal-footer">
              <button 
                onClick={handleCloseModal}
                className="cancel-button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Donors; 