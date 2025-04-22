import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaSync, FaPlus, FaInfoCircle } from 'react-icons/fa';
import { addDonorsToList, getAvailableDonors } from '../../services/donorService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AddDonorModal.css';

const AddDonorModal = ({ 
  isOpen, 
  onClose, 
  eventId, 
  onDonorAdded,
  currentEventDonors = []
}) => {
  const [availableDonors, setAvailableDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSearchQuery, setTempSearchQuery] = useState('');
  const [selectedDonors, setSelectedDonors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recommendedDonors, setRecommendedDonors] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [filteredRecommendedDonors, setFilteredRecommendedDonors] = useState([]);

  const fetchAvailableDonors = useCallback(async (customSearchQuery = searchQuery, pageNumber = currentPage) => {
    if (!eventId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getAvailableDonors(eventId, {
        page: pageNumber,
        limit: 10,
        search: customSearchQuery
      });
      
      setAvailableDonors(response.data || []);
      setTotalPages(response.total_pages || 1);
    } catch (err) {
      console.error('Error fetching available donors:', err);
      setError(err.message || 'Failed to load available donors');
    } finally {
      setLoading(false);
    }
  }, [eventId, searchQuery, currentPage]);

  useEffect(() => {
    if (isOpen) {
      setSelectedDonors([]);
      setSearchQuery('');
      setCurrentPage(1);
      fetchAvailableDonors();
    }
  }, [isOpen, eventId, fetchAvailableDonors]);

  useEffect(() => {
    if (isOpen && eventId) {
      fetchAvailableDonors();
    }
  }, [currentPage, isOpen, eventId, fetchAvailableDonors]);

  const fetchRecommendedDonors = useCallback(async () => {
    try {
      setLoadingRecommended(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/events/${eventId}/recommended-donors`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Filter out already participating donors
      const filteredDonors = data.recommendedDonors.filter(donor => 
        !currentEventDonors.some(eventDonor => eventDonor.id === donor.id)
      );
      
      setRecommendedDonors(filteredDonors);
    } catch (err) {
      console.error('Error fetching recommended donors:', err);
    } finally {
      setLoadingRecommended(false);
    }
  }, [eventId, currentEventDonors]);

  useEffect(() => {
    if (eventId && isOpen) {
      fetchRecommendedDonors();
    }
  }, [eventId, isOpen, fetchRecommendedDonors]);

  useEffect(() => {
    setFilteredRecommendedDonors(recommendedDonors);
  }, [recommendedDonors, fetchRecommendedDonors]);

  const handleSearch = (e) => {
    setTempSearchQuery(e.target.value);
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    
    // Filter recommended donors
    if (tempSearchQuery.trim() === '') {
      setFilteredRecommendedDonors(recommendedDonors);
    } else {
      const filtered = recommendedDonors.filter(donor => {
        const fullName = `${donor.firstName || ''} ${donor.lastName || ''}`.toLowerCase();
        const orgName = (donor.organizationName || '').toLowerCase();
        const searchTerm = tempSearchQuery.toLowerCase();
        return fullName.includes(searchTerm) || orgName.includes(searchTerm);
      });
      setFilteredRecommendedDonors(filtered);
    }
    
    // Use searchQuery update value directly for API call, not depending on state update
    setSearchQuery(tempSearchQuery);
    setCurrentPage(1);
    
    // Pass tempSearchQuery directly, not depending on searchQuery state
    try {
      setLoading(true);
      setError(null);
      
      if (!eventId) return;
      
      const response = await getAvailableDonors(eventId, {
        page: 1, // Always start from first page for new search
        limit: 10,
        search: tempSearchQuery // Pass tempSearchQuery directly, not searchQuery state
      });
      
      setAvailableDonors(response.data || []);
      setTotalPages(response.total_pages || 1);
    } catch (err) {
      console.error('Error fetching available donors:', err);
      setError(err.message || 'Failed to load available donors');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAvailableDonors(); // Use current searchQuery
    setIsRefreshing(false);
  };

  const handleDonorSelect = (donor) => {
    setSelectedDonors(prev => {
      if (prev.some(d => d.id === donor.id)) {
        return prev.filter(d => d.id !== donor.id);
      }
      return [...prev, donor];
    });
  };

  const handleAddMultipleDonors = async () => {
    if (!eventId || selectedDonors.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get donor list ID for the event
      const eventResponse = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/events/${eventId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!eventResponse.ok) {
        throw new Error(`Failed to get event info: ${eventResponse.status}`);
      }
      
      const eventData = await eventResponse.json();
      // Find the active donor list - use the first one if multiple exist
      let donorListId = null;
      if (eventData.donorLists && eventData.donorLists.length > 0) {
        donorListId = eventData.donorLists[0].id;
      } else if (eventData.donorList && eventData.donorList.id) {
        donorListId = eventData.donorList.id;
      }
      
      if (!donorListId) {
        throw new Error('Could not find donor list for this event');
      }
      
      // Extract donor IDs from selected donors
      const donorIds = selectedDonors.map(donor => donor.id);
      
      // Use batch API to add donors
      const response = await addDonorsToList(donorListId, donorIds);
      
      // Notify parent component to update
      if (onDonorAdded) {
        await onDonorAdded();
      }
      
      // Remove added donors from both lists
      setAvailableDonors(prev => 
        prev.filter(donor => !selectedDonors.some(d => d.id === donor.id))
      );
      setRecommendedDonors(prev => 
        prev.filter(donor => !selectedDonors.some(d => d.id === donor.id))
      );
      
      // Clear selection
      setSelectedDonors([]);
      
      toast.success(`Successfully added ${response.added || selectedDonors.length} donors`);
      onClose();
    } catch (err) {
      console.error('Failed to add donors:', err);
      setError(`Failed to add donors: ${err.message}`);
      toast.error(`Failed to add donors: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      // Merge recommended donors and other donors
      const allDonors = [...recommendedDonors, ...availableDonors];
      // Ensure no duplicate donors
      const uniqueDonors = Array.from(new Map(allDonors.map(donor => [donor.id, donor])).values());
      setSelectedDonors(uniqueDonors);
    } else {
      setSelectedDonors([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`}>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add Donors</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-header-actions">
            <div className="modal-search-container">
              <div className="search-input-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search donors' name..."
                  value={tempSearchQuery}
                  onChange={handleSearch}
                  className="modal-search-input"
                />
              </div>
              <button
                type="submit"
                className="modal-search-button"
                onClick={handleSearchSubmit}
                disabled={loading}
              >
                Search
              </button>
            </div>
            
            <div className="select-all-container">
              <input
                type="checkbox"
                checked={selectedDonors.length === (availableDonors.length + recommendedDonors.length) && (availableDonors.length + recommendedDonors.length) > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                id="select-all"
              />
              <label htmlFor="select-all">Select All</label>
            </div>

            <button
              className="refresh-button-icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh donor list"
            >
              <FaSync className={isRefreshing ? 'spinning' : ''} />
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="available-donors-list">
            {/* Loading indicator */}
            {loading && (
              <div className="loading-container">
                <div className="loading-spinner-large"></div>
                <p>Loading...</p>
              </div>
            )}

            {/* Recommended donors section */}
            {!loading && !loadingRecommended && filteredRecommendedDonors.length > 0 && (
              <>
                <div className="donor-section-header">
                  <h4>
                    Recommended Donors
                    <div className="tooltip-container">
                      <FaInfoCircle className="info-icon" />
                      <span className="tooltip-text">Donors from the same city as the event</span>
                    </div>
                  </h4>
                </div>
                {filteredRecommendedDonors.map(donor => (
                  <div 
                    key={donor.id}
                    className={`donor-item recommended ${selectedDonors.some(d => d.id === donor.id) ? 'selected' : ''}`}
                    onClick={() => handleDonorSelect(donor)}
                  >
                    <div className="donor-info">
                      <p className="donor-name">
                        {String(donor.firstName || '').normalize('NFKC')} {String(donor.lastName || '').normalize('NFKC')}
                        {donor.organizationName && donor.organizationName !== "null" && donor.organizationName !== null && (
                          <span className="organization-name">
                            ({String(donor.organizationName).normalize('NFKC')})
                          </span>
                        )}
                      </p>
                      <p className="donor-details">
                        <span>Total Donations: ${Number(donor.totalDonations || 0).toLocaleString()}</span>
                        {donor.city && donor.city !== "null" && donor.city !== null && <span> | {String(donor.city).normalize('NFKC')}</span>}
                      </p>
                    </div>
                    <div className="donor-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedDonors.some(d => d.id === donor.id)}
                        onChange={() => handleDonorSelect(donor)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Other donors section */}
            {!loading && availableDonors.length > 0 && (
              <>
                <div className="donor-section-header">
                  <h4>
                    Other Donors
                    <div className="tooltip-container">
                      <FaInfoCircle className="info-icon" />
                      <span className="tooltip-text">Donors from cities different from the event</span>
                    </div>
                  </h4>
                </div>
                {availableDonors.map(donor => (
                  <div 
                    key={donor.id}
                    className={`donor-item ${selectedDonors.some(d => d.id === donor.id) ? 'selected' : ''}`}
                    onClick={() => handleDonorSelect(donor)}
                  >
                    <div className="donor-info">
                      <p className="donor-name">
                        {String(donor.firstName || '').normalize('NFKC')} {String(donor.lastName || '').normalize('NFKC')}
                        {donor.organizationName && donor.organizationName !== "null" && donor.organizationName !== null && (
                          <span className="organization-name">
                            ({String(donor.organizationName).normalize('NFKC')})
                          </span>
                        )}
                      </p>
                      <p className="donor-details">
                        <span>Total Donations: ${Number(donor.totalDonations || 0).toLocaleString()}</span>
                        {donor.city && donor.city !== "null" && donor.city !== null && <span> | {String(donor.city).normalize('NFKC')}</span>}
                      </p>
                    </div>
                    <div className="donor-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedDonors.some(d => d.id === donor.id)}
                        onChange={() => handleDonorSelect(donor)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* No data state */}
            {!loading && availableDonors.length === 0 && filteredRecommendedDonors.length === 0 && (
              <div className="no-donors-message">
                <p>No donors found matching your criteria.</p>
                <p>Try a different search term or refresh the list.</p>
              </div>
            )}
          </div>

          <div className="modal-pagination">
            {totalPages > 1 && (
              <div className="pagination-controls">
                <button
                  onClick={() => {
                    const newPage = Math.max(1, currentPage - 1);
                    setCurrentPage(newPage);
                  }}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => {
                    const newPage = Math.min(totalPages, currentPage + 1);
                    setCurrentPage(newPage);
                  }}
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                </button>
              </div>
            )}
            
            {selectedDonors.length > 0 && (
              <button
                className="add-selected-button"
                onClick={handleAddMultipleDonors}
                disabled={loading}
              >
                <FaPlus /> Add Selected ({selectedDonors.length})
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddDonorModal; 