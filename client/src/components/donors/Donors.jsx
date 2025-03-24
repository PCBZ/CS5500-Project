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
  const [success, setSuccess] = useState('');

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
      const response = await getEvents({ status: 'Ready' });

      console.log('response', response.data);
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

      // 处理返回结果中的错误信息
      if (response.error && response.message) {
        setError(prev => ({ ...prev, donors: response.message }));
        setEventDonors([]);
        setTotalPages(1);
        setTotalDonors(0);
        return;
      }

      // 如果服务器表示需要创建捐赠者列表，尝试自动创建
      if (response.needsListCreation) {
        try {
          console.log('需要为事件创建捐赠者列表，尝试自动创建...');
          setError(prev => ({ 
            ...prev, 
            donors: '正在为此事件创建捐赠者列表...' 
          }));
          
          // 从eventService中导入函数
          const { createEventDonorList } = await import('../../services/eventService');
          
          // 尝试创建列表
          const listResult = await createEventDonorList(selectedEvent.id);
          console.log('捐赠者列表创建成功:', listResult);
          
          // 创建列表成功后重新获取捐赠者
          const updatedResponse = await getEventDonors(selectedEvent.id, {
            page: currentPage,
            limit: itemsPerPage,
            search: searchQuery || undefined
          });

          setEventDonors(updatedResponse.data || []);
          setTotalPages(updatedResponse.total_pages || 1);
          setTotalDonors(updatedResponse.total_count || 0);
          
          // 清除错误并显示成功消息
          setError(prev => ({ ...prev, donors: null }));
          setSuccess('捐赠者列表创建成功！');
          setTimeout(() => setSuccess(''), 3000);
          
          return; // 提前退出
        } catch (createErr) {
          console.error('自动创建捐赠者列表失败:', createErr);
          setError(prev => ({ 
            ...prev, 
            donors: `无法创建捐赠者列表: ${createErr.message || 'Unknown error'}。请联系管理员。` 
          }));
          setEventDonors([]);
          setTotalPages(1);
          setTotalDonors(0);
          return; // 提前退出
        }
      }

      console.log('$$$$$response.data$$$$$', response.data);
      // 正常处理捐赠者数据
      setEventDonors(response.data || []);
      setTotalPages(response.total_pages || 1);
      setTotalDonors(response.total_count || 0);
    } catch (err) {
      console.error('Failed to fetch event donors:', err);
      
      // 针对不同错误类型提供不同的用户提示
      let errorMessage = '加载捐赠者失败: ';
      
      if (err.message.includes('服务器内部错误')) {
        // 对于服务器内部错误，尝试自动创建捐赠者列表
        try {
          console.log('服务器内部错误，尝试创建捐赠者列表作为可能的解决方案...');
          setError(prev => ({ 
            ...prev, 
            donors: '服务器错误：尝试创建捐赠者列表...' 
          }));
          
          // 从eventService中导入函数
          const { createEventDonorList } = await import('../../services/eventService');
          
          // 尝试创建列表
          const listResult = await createEventDonorList(selectedEvent.id);
          console.log('捐赠者列表创建成功:', listResult);
          
          // 列表创建后重新获取捐赠者
          const updatedResponse = await getEventDonors(selectedEvent.id, {
            page: currentPage,
            limit: itemsPerPage,
            search: searchQuery || undefined
          });
          
          setEventDonors(updatedResponse.data || []);
          setTotalPages(updatedResponse.total_pages || 1);
          setTotalDonors(updatedResponse.total_count || 0);
          
          // 清除错误并显示成功消息
          setError(prev => ({ ...prev, donors: null }));
          setSuccess('捐赠者列表创建成功！问题已解决。');
          setTimeout(() => setSuccess(''), 5000);
          
          return; // 提前退出
        } catch (createErr) {
          console.error('尝试创建捐赠者列表失败:', createErr);
          errorMessage += '服务器内部错误，自动修复失败。请联系管理员查看服务器日志。';
        }
      } else if (err.message.includes('网络连接错误')) {
        errorMessage += '网络连接问题，请检查您的网络连接后重试';
      } else if (err.message.includes('No authentication token found')) {
        errorMessage += '会话已过期，请重新登录';
        // 可以在这里添加重定向到登录页的逻辑
      } else {
        errorMessage += (err.message || 'Unknown error');
      }
      
      setError(prev => ({ ...prev, donors: errorMessage }));
      setEventDonors([]);
      setTotalPages(1);
      setTotalDonors(0);
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
      console.error('Failed to fetch event statistics:', err);
      setError(prev => ({ ...prev, stats: 'Failed to load statistics: ' + (err.message || 'Unknown error') }));
      // 设置默认的空统计信息
      setStats({ pending: 0, approved: 0, excluded: 0 });
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  /**
   * Open the add donor modal
   */
  const handleOpenAddDonorModal = async () => {
    if (!selectedEvent) return;
    
    setShowAddDonorModal(true); // 立即显示模态窗口，同时加载数据
    setLoading(prev => ({ ...prev, availableDonors: true }));
    setError(prev => ({ ...prev, availableDonors: null }));
    
    try {
      // 获取未添加到事件的捐赠者
      const result = await getAvailableDonors(selectedEvent.id, {
        page: 1,
        limit: 100
      });
      
      setAvailableDonors(result.data || []);
      
      if (result.data.length === 0) {
        setError(prev => ({ 
          ...prev, 
          availableDonors: 'No donors available to add. All donors may have already been added to this event.' 
        }));
      }
    } catch (error) {
      console.error('Error fetching available donors:', error);
      setError(prev => ({ 
        ...prev, 
        availableDonors: 'Failed to fetch available donors: ' + (error.message || 'Unknown error')
      }));
      
      // 重置可用捐赠者列表
      setAvailableDonors([]);
    } finally {
      setLoading(prev => ({ ...prev, availableDonors: false }));
    }
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowAddDonorModal(false);
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
      
      // 调用API将捐赠者添加到事件
      const result = await addDonorToEvent(selectedEvent.id, donorId);
      
      // 如果响应中包含新创建的列表信息，可以在UI中进行相应更新
      if (result.donorList) {
        console.log('Donor list created or updated:', result.donorList);
      }
      
      // 更新事件捐赠者数据
      await fetchEventDonors();
      await fetchEventStats();
      
      // 从可用捐赠者列表中移除此捐赠者
      setAvailableDonors(prev => prev.filter(donor => {
        const id = donor.id || donor.donor_id || donor.donorId;
        return id !== donorId;
      }));
      
      // 显示成功消息
      setSuccess('Donor added successfully');
      setTimeout(() => setSuccess(''), 3000);
      
      // 刷新可用捐赠者列表
      try {
        const updatedAvailableDonors = await getAvailableDonors(selectedEvent.id, {
          page: 1,
          limit: 100
        });
        setAvailableDonors(updatedAvailableDonors.data || []);
      } catch (refreshError) {
        console.error('Error refreshing available donors:', refreshError);
        // 错误已经处理，但不影响主流程
      }
    } catch (error) {
      console.error('Error adding donor to event:', error);
      
      // 特殊处理捐赠者已存在的情况
      if (error.message && error.message.includes('already in this event')) {
        setError(prev => ({ ...prev, donors: 'This donor is already in this event' }));
      } else {
        setError(prev => ({ ...prev, donors: 'Failed to add donor: ' + (error.message || 'Unknown error') }));
      }
      
      // 刷新捐赠者列表以确保UI一致性
      try {
        await fetchEventDonors();
      } catch (fetchError) {
        console.error('Failed to refresh donors after error:', fetchError);
      }
    } finally {
      setLoading(prev => ({ ...prev, donors: false }));
    }
  };

  /**
   * Remove a donor from the currently selected event
   * @param {number} eventDonorId - The ID of the event donor record to remove
   */
  const handleRemoveDonor = async (eventDonorId) => {
    if (!selectedEvent || !eventDonorId) return;
    
    // 确认是否移除捐赠者
    if (!window.confirm('Are you sure you want to remove this donor from the event?')) {
      return;
    }

    try {
      setLoading(prev => ({ ...prev, donors: true }));
      
      // 调用API从事件中移除捐赠者
      await removeDonorFromEvent(selectedEvent.id, eventDonorId);
      
      // 更新数据
      fetchEventDonors();
      fetchEventStats();
      
      // 显示成功消息
      setSuccess('Donor removed successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error removing donor from event:', error);
      setError(prev => ({ ...prev, donors: 'Failed to remove donor: ' + (error.message || 'Unknown error') }));
    } finally {
      setLoading(prev => ({ ...prev, donors: false }));
    }
  };

  /**
   * Format a date string for display
   * @param {string} dateString - The date string to format
   * @returns {string} Formatted date
   */
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      // Format as MM/DD/YYYY
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
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

  // 添加一个重试功能的函数
  const handleRetryFetchDonors = () => {
    // 可以添加延迟重试或其他逻辑
    console.log('Retrying to fetch donors...');
    fetchEventDonors();
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
                  <div className="stat-label">Pending</div>
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
            
            {/* 错误消息显示 */}
            {error.donors && (
              <div className="error-message">
                <p>{error.donors}</p>
                <p className="error-hint">
                  {error.donors.includes('无法创建捐赠者列表') || error.donors.includes('服务器内部错误') ? 
                    '提示：服务器端可能存在数据库字段问题。您可以尝试点击重试按钮，或者联系系统管理员修复服务器端代码中的排序字段错误。' : 
                    '请尝试刷新页面或者稍后再试。'}
                </p>
                <div className="error-actions">
                  <button onClick={handleRetryFetchDonors}>重试</button>
                  <button onClick={() => window.location.reload()}>刷新页面</button>
                </div>
              </div>
            )}
            
            {/* 成功消息显示 */}
            {success && (
              <div className="success-message">
                <p>{success}</p>
              </div>
            )}
            
            {!loading.donors && !error.donors && (
              <>
                {eventDonors.length === 0 ? (
                  <div className="no-donors-message">
                    <button 
                      className="add-donor-button-large"
                      onClick={handleOpenAddDonorModal}
                      disabled={!selectedEvent}
                    >
                      <FaPlus /> Add Your First Donor
                    </button>
                  </div>
                ) : (
                  <div className="donors-grid">
                    {eventDonors.map(donor => {
                      // Extract donor data handling both flat and nested structures
                      const donorData = donor.donor || donor;
                      const firstName = donorData.firstName || donorData.first_name;
                      const lastName = donorData.lastName || donorData.last_name;
                      const organizationName = donorData.organizationName || donorData.organization_name;
                      const tags = donorData.tags || [];
                      const totalDonations = donorData.totalDonations || donorData.total_donations || 0;
                      const largestGift = donorData.largestGift || donorData.largest_gift || 0;
                      const lastGiftAmount = donorData.lastGiftAmount || donorData.last_gift_amount || 0;
                      const lastGiftDate = donorData.lastGiftDate || donorData.last_gift_date;
                      
                      // Get status and comment from the top-level donor object
                      const status = donor.status || 'Pending';
                      const comments = donor.comments;
                      
                      return (
                        <div key={donor.id} className="donor-card">
                          <div className="donor-card-header">
                            <FaUser className="donor-icon" />
                            <h3>{firstName} {lastName}</h3>
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
                            {organizationName && <p><strong>Organization:</strong> {organizationName}</p>}
                            {tags && <p><strong>Tags:</strong> {typeof tags === 'string' ? tags : tags.join(', ')}</p>}
                            <p><strong>Total Donations:</strong> ${totalDonations.toLocaleString()}</p>
                            <p><strong>Largest Gift:</strong> ${largestGift.toLocaleString()}</p>
                            {lastGiftDate && (
                              <p><strong>Last Gift:</strong> ${lastGiftAmount.toLocaleString()} ({formatDate(lastGiftDate)})</p>
                            )}
                            {status && (
                              <p className={`donor-status ${status.toLowerCase()}`}>
                                <strong>Status:</strong> {status}
                              </p>
                            )}
                            {comments && (
                              <p><strong>Comments:</strong> {comments}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
            <div className="modal-header">
              <h3>Add Donor</h3>
              <button className="close-button" onClick={handleCloseModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="refresh-container">
                <button 
                  className="refresh-button" 
                  onClick={async () => {
                    try {
                      setLoading(prev => ({ ...prev, availableDonors: true }));
                      // 使用donorList API刷新可用捐赠者列表
                      const refreshedDonors = await getAvailableDonors(selectedEvent.id, {
                        page: 1,
                        limit: 100
                      });
                      setAvailableDonors(refreshedDonors.data || []);
                    } catch (error) {
                      console.error('Error refreshing available donors:', error);
                      setError(prev => ({ ...prev, availableDonors: 'Failed to refresh donor list' }));
                    } finally {
                      setLoading(prev => ({ ...prev, availableDonors: false }));
                    }
                  }}
                  disabled={loading.availableDonors}
                >
                  {loading.availableDonors ? <FaSpinner className="loading-spinner" /> : 'Refresh List'}
                </button>
              </div>
              
              {error.availableDonors && (
                <div className="error-message">
                  <p>{error.availableDonors}</p>
                  <button onClick={() => setError(prev => ({ ...prev, availableDonors: null }))}>Close</button>
                </div>
              )}
              
              {loading.availableDonors ? (
                <div className="loading-indicator">
                  <FaSpinner className="loading-spinner" />
                  <p>Loading available donors...</p>
                </div>
              ) : availableDonors.length === 0 ? (
                <div className="no-donors-message">
                  <p>No donors available to add</p>
                </div>
              ) : (
                <div className="available-donors-list">
                  {availableDonors.map(donor => (
                    <div key={donor.id} className="donor-item">
                      <div className="donor-info">
                        <p className="donor-name">
                          {donor.firstName} {donor.lastName}
                          {donor.organizationName && <span> ({donor.organizationName})</span>}
                        </p>
                        <p className="donor-details">
                          <span>Total Donations: ${donor.totalDonations?.toLocaleString() || 0}</span>
                          {donor.city && <span> | {donor.city}</span>}
                        </p>
                      </div>
                      <button 
                        className="add-button" 
                        onClick={() => handleAddDonor(donor.id)}
                        disabled={loading.donors}
                      >
                        {loading.donors ? <FaSpinner className="loading-spinner" /> : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Donors; 