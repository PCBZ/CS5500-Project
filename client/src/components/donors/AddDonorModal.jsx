import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaSync, FaPlus, FaSpinner } from 'react-icons/fa';
import { addDonorToEvent, getAvailableDonors } from '../../services/donorService';
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
  const [selectedDonors, setSelectedDonors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [addingProgress, setAddingProgress] = useState(0);
  const [addingStatus, setAddingStatus] = useState('');
  const [loadingTime, setLoadingTime] = useState(3);

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

  useEffect(() => {
    let timer;
    if (loading && !addingProgress && loadingTime > 0) {
      timer = setInterval(() => {
        setLoadingTime(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [loading, addingProgress, loadingTime]);

  const fetchAvailableDonors = async () => {
    try {
      setLoading(true);
      setLoadingTime(3);
      setError(null);
      const response = await getAvailableDonors(eventId, {
        page: currentPage,
        limit: 10,
        search: searchQuery
      });
      
      console.log('API Response:', response);
      
      if (response?.data && Array.isArray(response.data)) {
        const filteredDonors = response.data.filter(donor => 
          !currentEventDonors.some(eventDonor => eventDonor.id === donor.id)
        );
        
        setAvailableDonors(filteredDonors);
        const totalCount = Math.max(0, (response.total_count || 0) - currentEventDonors.length);
        const limit = response.limit || 10;
        const calculatedTotalPages = Math.ceil(totalCount / limit);
        setTotalPages(calculatedTotalPages);
        console.log('Calculated total pages:', calculatedTotalPages);
      } else {
        console.warn('Invalid response format:', response);
        setAvailableDonors([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching donors:', err);
      setError(err.message || 'Failed to fetch available donors');
      setAvailableDonors([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
    // Trigger a new fetch after state updates
    const searchValue = e.target.value;
    try {
      setLoading(true);
      setError(null);
      const response = await getAvailableDonors(eventId, {
        page: 1,
        limit: 10,
        search: searchValue
      });
      
      if (response?.data && Array.isArray(response.data)) {
        // 过滤掉已经在活动中的捐赠者
        const filteredDonors = response.data.filter(donor => 
          !currentEventDonors.some(eventDonor => eventDonor.id === donor.id)
        );
        setAvailableDonors(filteredDonors);
        
        // 基于过滤后的总数计算页数
        const totalCount = Math.max(0, (response.total_count || 0) - currentEventDonors.length);
        const limit = response.limit || 10;
        const calculatedTotalPages = Math.ceil(totalCount / limit);
        setTotalPages(calculatedTotalPages);
      } else {
        console.warn('Invalid response format:', response);
        setAvailableDonors([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching donors:', err);
      setError(err.message || 'Failed to fetch available donors');
      setAvailableDonors([]);
      setTotalPages(1);
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
    if (selectedDonors.length === 0) return;
    
    try {
      setLoading(true);
      setAddingStatus('Preparing to add donors...');
      setError(null);
      
      const totalDonors = selectedDonors.length;
      const addedDonors = [];
      
      for (let i = 0; i < selectedDonors.length; i++) {
        const donor = selectedDonors[i];
        setAddingStatus(`Adding donor ${i + 1} of ${totalDonors}...`);
        setAddingProgress(((i + 1) / totalDonors) * 100);
        
        try {
          await addDonorToEvent(eventId, donor.id);
          addedDonors.push(donor.id);
        } catch (err) {
          console.error(`Failed to add donor ${donor.id}:`, err);
          setError(`Failed to add some donors. Please try again.`);
          break;
        }
      }
      
      if (addedDonors.length > 0) {
        // 立即从可用列表中移除已添加的捐赠者
        setAvailableDonors(prev => 
          prev.filter(donor => !addedDonors.includes(donor.id))
        );
        
        // 清空选中状态
        setSelectedDonors([]);
        
        // 通知父组件更新
        if (onDonorAdded) {
          await onDonorAdded();
        }
        
        setAddingStatus('Donors added successfully!');
        setAddingProgress(100);
        
        // 重新获取可用捐赠者列表
        await fetchAvailableDonors();
      }
      
      // 延迟重置进度条
      setTimeout(() => {
        setAddingProgress(0);
        setAddingStatus('');
      }, 2000);
      
    } catch (err) {
      console.error('Error adding donors:', err);
      setError(err.message || 'Failed to add donors');
      setAddingStatus('Error adding donors');
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
        {loading && addingProgress > 0 && (
          <div className="adding-progress-container">
            <div className="adding-progress-info">
              <span className="adding-progress-percentage">
                {Math.round(addingProgress)}%
              </span>
              <span className="adding-progress-status">
                {addingStatus}
              </span>
            </div>
            <div className="adding-progress-bar-wrapper">
              <div 
                className={`adding-progress-bar ${
                  error ? 'error' : 
                  addingProgress === 100 ? 'completed' : 
                  'processing'
                }`}
                style={{ width: `${addingProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <div className={`modal-header ${loading && addingProgress > 0 ? 'with-progress' : ''}`}>
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
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search donors' name..."
                value={searchQuery}
                onChange={handleSearch}
                className="modal-search-input"
              />
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

          {loading && !addingProgress ? (
            <div className="loading-container">
              <div className="loading-spinner-large"></div>
              <p>Loading{loadingTime >= 0 ? ` (${loadingTime}s)` : ''}...</p>
            </div>
          ) : (
            <>
              <div className="available-donors-list">
                {availableDonors.length === 0 ? (
                  <div className="no-donors-message">
                    No donors available to add
                  </div>
                ) : (
                  availableDonors.map(donor => {
                    if (!donor || typeof donor !== 'object') return null;
                    
                    const donorId = donor.id;
                    if (!donorId) return null;
                    
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
                  })
                )}
              </div>

              <div className="modal-pagination">
                {totalPages > 1 && (
                  <>
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
                  </>
                )}
                
                {selectedDonors.length > 0 && (
                  <button
                    className="bulk-add-button"
                    onClick={handleAddMultipleDonors}
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="button-loading">
                        Adding {selectedDonors.length} Donors...
                      </div>
                    ) : (
                      `Add ${selectedDonors.length} Selected Donors`
                    )}
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