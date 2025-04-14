import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaSync, FaPlus } from 'react-icons/fa';
import { addDonorsToList, getAvailableDonors } from '../../services/donorService';
import { toast } from 'react-hot-toast';
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

  useEffect(() => {
    if (isOpen) {
      setSelectedDonors([]);
      setSearchQuery('');
      setCurrentPage(1);
      fetchAvailableDonors();
    }
  }, [isOpen, eventId]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchAvailableDonors();
    }
  }, [currentPage]);

  const handleSearch = (e) => {
    setTempSearchQuery(e.target.value);
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setSearchQuery(tempSearchQuery);
    setCurrentPage(1);
    await fetchAvailableDonors();
  };

  const fetchAvailableDonors = async () => {
    if (!eventId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getAvailableDonors(eventId, {
        page: currentPage,
        limit: 10,
        search: searchQuery
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
    await fetchAvailableDonors();
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
      const donorsToAdd = selectedDonors.map(donor => ({
        donor_id: donor.id,
        status: 'Pending'
      }));
      
      await addDonorsToList(eventId, donorsToAdd);
      toast.success(`Successfully added ${selectedDonors.length} donors`);
      
      // Call the onDonorAdded callback if provided
      if (onDonorAdded) {
        onDonorAdded();
      }
      
      // Close the modal
      onClose();
    } catch (err) {
      console.error('Error adding donors:', err);
      setError(err.message || 'Failed to add donors');
      toast.error('Failed to add donors: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedDonors(availableDonors);
    } else {
      setSelectedDonors([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Add Donors</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="modal-header-actions">
            <div className="modal-search-container">
              <form onSubmit={handleSearchSubmit} className="search-input-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search donors' name..."
                  value={tempSearchQuery}
                  onChange={handleSearch}
                  className="modal-search-input"
                />
                <button
                  type="submit"
                  className="modal-search-button"
                  disabled={loading}
                >
                  Search
                </button>
              </form>
            </div>
            
            <div className="select-all-container">
              <input
                type="checkbox"
                checked={selectedDonors.length === availableDonors.length && availableDonors.length > 0}
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

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner-large"></div>
              <p>Loading...</p>
            </div>
          ) : (
            <>
              <div className="available-donors-list">
                {availableDonors.map(donor => {
                  const donorId = donor.id || donor.donor_id || donor.donorId;
                  const firstName = donor.firstName || donor.first_name || '';
                  const lastName = donor.lastName || donor.last_name || '';
                  const organizationName = donor.organizationName || donor.organization_name || '';
                  
                  return (
                    <div 
                      key={donorId}
                      className={`donor-item ${selectedDonors.some(d => d.id === donorId) ? 'selected' : ''}`}
                      onClick={() => handleDonorSelect(donor)}
                    >
                      <div className="donor-info">
                        <p className="donor-name">
                          {firstName} {lastName}
                          {organizationName && <span> ({organizationName})</span>}
                        </p>
                        <p className="donor-details">
                          <span>Total Donations: ${Number(donor.totalDonations || 0).toLocaleString()}</span>
                          {donor.city && <span> | {String(donor.city).normalize('NFKC')}</span>}
                        </p>
                      </div>
                      <div className="donor-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedDonors.some(d => d.id === donorId)}
                          onChange={() => handleDonorSelect(donor)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="modal-pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  Next
                </button>
                
                {selectedDonors.length > 0 && (
                  <button
                    className="bulk-add-button"
                    onClick={handleAddMultipleDonors}
                    disabled={loading}
                  >
                    Add {selectedDonors.length} Selected Donors
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddDonorModal; 