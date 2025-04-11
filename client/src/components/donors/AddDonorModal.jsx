import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaSync, FaPlus } from 'react-icons/fa';
import { addDonorToEvent, getAvailableDonors } from '../../services/donorService';
import './AddDonorModal.css';

const AddDonorModal = ({ 
  isOpen, 
  onClose, 
  eventId, 
  onDonorAdded 
}) => {
  const [availableDonors, setAvailableDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDonors, setSelectedDonors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isOpen && eventId) {
      fetchAvailableDonors();
    }
  }, [isOpen, eventId, currentPage]);

  const fetchAvailableDonors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAvailableDonors(eventId, {
        page: currentPage,
        limit: 10,
        search: searchQuery
      });
      
      console.log('API Response:', response);
      
      const donors = Array.isArray(response?.data) ? response.data : [];
      console.log('Processed Donors:', donors);
      
      const validDonors = donors.filter(donor => {
        if (!donor || typeof donor !== 'object') {
          console.warn('Invalid donor object:', donor);
          return false;
        }
        return true;
      });
      
      setAvailableDonors(validDonors);
      setTotalPages(response?.totalPages || 1);
    } catch (err) {
      console.error('Error fetching donors:', err);
      setError(err.message || 'Failed to fetch available donors');
      setAvailableDonors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAvailableDonors();
    setIsRefreshing(false);
  };

  const handleDonorSelect = (donor) => {
    setSelectedDonors(prev => {
      const isSelected = prev.some(d => d.id === donor.id);
      if (isSelected) {
        return prev.filter(d => d.id !== donor.id);
      } else {
        return [...prev, donor];
      }
    });
  };

  const handleAddDonor = async (donorId) => {
    try {
      setLoading(true);
      await addDonorToEvent(eventId, donorId);
      if (onDonorAdded) {
        onDonorAdded();
      }
      // Remove the added donor from available donors
      setAvailableDonors(prev => prev.filter(d => d.id !== donorId));
      // Remove from selected donors
      setSelectedDonors(prev => prev.filter(d => d.id !== donorId));
    } catch (err) {
      setError(err.message || 'Failed to add donor');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMultipleDonors = async () => {
    try {
      setLoading(true);
      for (const donor of selectedDonors) {
        await addDonorToEvent(eventId, donor.id);
      }
      if (onDonorAdded) {
        onDonorAdded();
      }
      // Refresh available donors
      await fetchAvailableDonors();
      // Clear selected donors
      setSelectedDonors([]);
    } catch (err) {
      setError(err.message || 'Failed to add donors');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (!isOpen) return null;

  const filteredDonors = availableDonors
    .filter(donor => {
      if (!donor || typeof donor !== 'object') {
        console.warn('Invalid donor object:', donor);
        return false;
      }
      
      const searchTerm = searchQuery.toLowerCase();
      
      // 使用更安全的方式处理多语言字符
      const firstName = String(donor.firstName || '').normalize('NFKC').toLowerCase();
      const lastName = String(donor.lastName || '').normalize('NFKC').toLowerCase();
      const organizationName = String(donor.organizationName || '').normalize('NFKC').toLowerCase();
      
      return firstName.includes(searchTerm) ||
        lastName.includes(searchTerm) ||
        organizationName.includes(searchTerm);
    })
    .filter(Boolean);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Add Donor</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="modal-header-actions">
            <div className="modal-search-container">
              <input
                type="text"
                placeholder="Search donors..."
                value={searchQuery}
                onChange={handleSearch}
                className="modal-search-input"
              />
              <FaSearch className="search-icon" />
            </div>
            <button 
              className="refresh-button-icon" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh List"
            >
              {isRefreshing ? <FaSync className="spinner" /> : <FaSync />}
            </button>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner-large"></div>
              <p>Loading...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={fetchAvailableDonors} className="retry-button">Retry</button>
            </div>
          ) : filteredDonors.length === 0 ? (
            <div className="no-donors-message">
              <p>No donors available</p>
            </div>
          ) : (
            <>
              <div className="available-donors-list">
                {filteredDonors.map(donor => {
                  if (!donor || typeof donor !== 'object') return null;
                  
                  const donorId = donor.id;
                  if (!donorId) return null;
                  
                  // 安全地处理多语言名字
                  const firstName = String(donor.firstName || '').normalize('NFKC');
                  const lastName = String(donor.lastName || '').normalize('NFKC');
                  const organizationName = donor.organizationName ? String(donor.organizationName).normalize('NFKC') : null;
                  
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

              {selectedDonors.length > 0 && (
                <div className="bulk-actions">
                  <button
                    className="bulk-add-button"
                    onClick={handleAddMultipleDonors}
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : `Add ${selectedDonors.length} Selected Donors`}
                  </button>
                </div>
              )}

              <div className="modal-pagination">
                <button
                  className="pagination-button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="pagination-button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddDonorModal; 