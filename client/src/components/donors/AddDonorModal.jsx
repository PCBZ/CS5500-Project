import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaSync, FaPlus, FaSpinner, FaInfoCircle } from 'react-icons/fa';
import { addDonorToEvent, addDonorsToList, getAvailableDonors } from '../../services/donorService';
import { toast } from 'react-toastify';
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
  const [addingProgress, setAddingProgress] = useState(null);
  const [addingStatus, setAddingStatus] = useState('');
  const [loadingTime, setLoadingTime] = useState(-1);
  const [recommendedDonors, setRecommendedDonors] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [filteredRecommendedDonors, setFilteredRecommendedDonors] = useState([]);

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

  useEffect(() => {
    if (eventId) {
      fetchRecommendedDonors();
    }
  }, [eventId]);

  useEffect(() => {
    setFilteredRecommendedDonors(recommendedDonors);
  }, [recommendedDonors]);

  const handleSearch = (e) => {
    setTempSearchQuery(e.target.value);
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    
    // 过滤推荐捐赠者
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
    
    // 使用searchQuery的更新值直接用于API调用，而不是依赖状态更新
    setSearchQuery(tempSearchQuery);
    setCurrentPage(1);
    
    // 直接传入tempSearchQuery，而不是依赖searchQuery状态
    try {
      setLoading(true);
      setError(null);
      
      if (!eventId) return;
      
      const response = await getAvailableDonors(eventId, {
        page: 1, // 始终从第一页开始新搜索
        limit: 10,
        search: tempSearchQuery // 直接使用tempSearchQuery而不是searchQuery
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

  const fetchAvailableDonors = async (customSearchQuery = searchQuery) => {
    if (!eventId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getAvailableDonors(eventId, {
        page: currentPage,
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
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAvailableDonors(); // 使用当前的searchQuery
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

  const handleAddDonor = async (donorId) => {
    try {
      setLoading(true);
      await addDonorToEvent(eventId, donorId);
      if (onDonorAdded) {
        onDonorAdded();
      }
      // Remove the added donor from both available and recommended donors
      setAvailableDonors(prev => prev.filter(d => d.id !== donorId));
      setRecommendedDonors(prev => prev.filter(d => d.id !== donorId));
      // Remove from selected donors
      setSelectedDonors(prev => prev.filter(d => d.id !== donorId));
    } catch (err) {
      setError(err.message || 'Failed to add donor');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMultipleDonors = async () => {
    if (!eventId || selectedDonors.length === 0) return;
    
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
        // 从两个列表中移除已添加的捐赠者
        setAvailableDonors(prev => 
          prev.filter(donor => !addedDonors.includes(donor.id))
        );
        setRecommendedDonors(prev => 
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
      // 合并推荐捐赠者和其他捐赠者
      const allDonors = [...recommendedDonors, ...availableDonors];
      // 确保没有重复的捐赠者
      const uniqueDonors = Array.from(new Map(allDonors.map(donor => [donor.id, donor])).values());
      setSelectedDonors(uniqueDonors);
    } else {
      setSelectedDonors([]);
    }
  };

  const fetchRecommendedDonors = async () => {
    try {
      setLoadingRecommended(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/events/${eventId}/recommended-donors`,
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
      
      // 过滤掉已经在活动中的捐赠者
      const filteredDonors = data.recommendedDonors.filter(donor => 
        !currentEventDonors.some(eventDonor => eventDonor.id === donor.id)
      );
      
      setRecommendedDonors(filteredDonors);
    } catch (err) {
      console.error('Error fetching recommended donors:', err);
    } finally {
      setLoadingRecommended(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`}>
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
            {/* 添加加载状态指示器 */}
            {loading && !addingProgress && (
              <div className="loading-container">
                <div className="loading-spinner-large"></div>
                <p>Loading donors...</p>
              </div>
            )}

            {/* 推荐捐赠者部分 */}
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

            {/* 其他捐赠者部分 */}
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

            {/* 无数据状态 */}
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
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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