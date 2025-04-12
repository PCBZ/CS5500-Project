import React, { useState, useEffect } from 'react';
import { FaUser, FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaClock, FaPlus, FaTrash, FaAngleDown, FaSpinner, FaEdit, FaComment, FaDownload, FaSync, FaEnvelope, FaPhone } from 'react-icons/fa';
import { getEvents, getEventById, getEventDonors } from '../../services/eventService';
import { getAvailableDonors, addDonorToEvent, removeDonorFromEvent, getEventDonorStats, updateDonorStatus, updateEventDonor, exportEventDonorsToCsv } from '../../services/donorService';
import { useLocation } from 'react-router-dom';
import './Donors.css';
import DonorList from './DonorList';
import EventDetail from './EventDetail';
import AddDonorModal from './AddDonorModal';


// Temporary workaround to ensure mock data works without authentication
// REMOVE THIS FOR PRODUCTION
const setupMockToken = () => {
  if (!localStorage.getItem('token')) {
    console.warn('Setting temporary mock token for development');
    localStorage.setItem('token', 'mock-token-for-development-only');
  }
};

const Donors = () => {
  const location = useLocation();
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
  const [editComments, setEditComments] = useState('');
  const [editExcludeReason, setEditExcludeReason] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [editStatus, setEditStatus] = useState('Pending');
  const [exporting, setExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddingDonorToList, setIsAddingDonorToList] = useState(null);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalCurrentPage, setModalCurrentPage] = useState(1);
  const [modalTotalPages, setModalTotalPages] = useState(1);
  const [modalTotalDonors, setModalTotalDonors] = useState(0);
  const [modalItemsPerPage, setModalItemsPerPage] = useState(10);
  const [selectedDonors, setSelectedDonors] = useState([]);
  const [dropdownSearch, setDropdownSearch] = useState('');


  // Set up mock token for development
  useEffect(() => {
    setupMockToken();
  }, []);

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Handle event selection from location state
  useEffect(() => {
    if (location.state?.selectedEventId) {
      const eventId = location.state.selectedEventId;
      const event = events.find(e => e.id === eventId);
      if (event) {
        setSelectedEvent(event);
      } else {
        // If event not found in current events list, fetch it
        getEventById(eventId)
          .then(response => {
            if (response.data) {
              setSelectedEvent(response.data);
            }
          })
          .catch(error => {
            console.error('Error fetching event:', error);
            setError(prev => ({ ...prev, events: 'Failed to load selected event' }));
          });
      }
    }
  }, [location.state?.selectedEventId, events]);

  // Fetch donors when selected event changes or search/page changes
  useEffect(() => {
    if (selectedEvent) {
      fetchEventDonors();
      if (!searchQuery) {
        fetchEventStats();
      }
    }
  }, [selectedEvent, searchQuery, currentPage]);

  // Fetch events
  const fetchEvents = async () => {
    setLoading(prev => ({ ...prev, events: true }));
    setError(prev => ({ ...prev, events: null }));

    try {
      const response = await getEvents();

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

  const handleRelatedEventSelect = (event) => {
    if (!event || event.id === selectedEvent?.id) return;
    
    setSelectedEvent(event);
    setCurrentPage(1);
    setSearchQuery('');
    setStatusFilter('');
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

      // Check if server indicates need to create donor list
      if (response.needsListCreation) {
        try {
          console.log('Need to create a donor list for this event, attempting automatic creation...');
          setError(prev => ({ 
            ...prev, 
            donors: 'Creating donor list for this event...' 
          }));
          
          // Import function from eventService
          const { createEventDonorList } = await import('../../services/eventService');
          
          // Try to create the list
          const listResult = await createEventDonorList(selectedEvent.id);
          console.log('Donor list created successfully:', listResult);
          
          // Fetch donors again after list creation
          const updatedResponse = await getEventDonors(selectedEvent.id, {
            page: currentPage,
            limit: itemsPerPage,
            search: searchQuery || undefined
          });

          setEventDonors(updatedResponse.data || []);
          setTotalPages(updatedResponse.total_pages || 1);
          setTotalDonors(updatedResponse.total_count || 0);
          
          // Clear error and show success message
          setError(prev => ({ ...prev, donors: null }));
          setSuccess('Donor list created successfully!');
          setTimeout(() => setSuccess(''), 3000);
          
          return; // Exit early
        } catch (createErr) {
          console.error('Failed to automatically create donor list:', createErr);
          setError(prev => ({ 
            ...prev, 
            donors: `Unable to create donor list: ${createErr.message || 'Unknown error'}. Please contact administrator.` 
          }));
          setEventDonors([]);
          setTotalPages(1);
          setTotalDonors(0);
          return; // Exit early
        }
      }
      
      // Process the donors data normally
      setEventDonors(response.data || []);
      setTotalPages(response.total_pages || 1);
      setTotalDonors(response.total_count || 0);
    } catch (err) {
      console.error('Failed to fetch event donors:', err);
      
      // Provide different error messages based on error type
      let errorMessage = 'Failed to load donors: ';
      
      if (err.message.includes('Internal server error')) {
        // For server internal errors, try to auto-create donor list
        try {
          console.log('Server internal error, attempting to create donor list as possible solution...');
          setError(prev => ({ 
            ...prev, 
            donors: 'Server error: Attempting to create donor list...' 
          }));
          
          // Import function from eventService
          const { createEventDonorList } = await import('../../services/eventService');
          
          // Try to create the list
          const listResult = await createEventDonorList(selectedEvent.id);
          console.log('Donor list created successfully:', listResult);
          
          // Fetch donors again after list creation
          const updatedResponse = await getEventDonors(selectedEvent.id, {
            page: currentPage,
            limit: itemsPerPage,
            search: searchQuery || undefined
          });
          
          setEventDonors(updatedResponse.data || []);
          setTotalPages(updatedResponse.total_pages || 1);
          setTotalDonors(updatedResponse.total_count || 0);
          
          // Clear error and show success message
          setError(prev => ({ ...prev, donors: null }));
          setSuccess('Donor list created successfully! Issue resolved.');
          setTimeout(() => setSuccess(''), 5000);
          
          return; // Exit early
        } catch (createErr) {
          console.error('Failed to create donor list:', createErr);
          errorMessage += 'Server internal error, automatic fix failed. Please contact administrator to check server logs.';
        }
      } else if (err.message.includes('Network error')) {
        errorMessage += 'Network connection problem, please check your network connection and try again';
      } else if (err.message.includes('No authentication token found')) {
        errorMessage += 'Session expired, please log in again';
        // Could add redirect to login page logic here
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
    
    try {
      // 先显示模态框
      setShowAddDonorModal(true);
      
      // 重置搜索和分页状态
      setModalSearchQuery('');
      setModalCurrentPage(1);
      
      setLoading(prev => ({ ...prev, availableDonors: true }));
      setError(prev => ({ ...prev, availableDonors: null }));
      
      // 获取第一页可用捐赠者
      const result = await getAvailableDonors(selectedEvent.id, {
        page: 1,
        limit: modalItemsPerPage,
        search: ''
      });
      
      setAvailableDonors(result.data || []);
      setModalTotalPages(result.total_pages || 1);
      setModalTotalDonors(result.total_count || 0);
    } catch (error) {
      console.error('Error fetching available donors:', error);
      setError(prev => ({ ...prev, availableDonors: error.message }));
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

  // 添加关闭添加捐赠者模态框的函数
  const handleCloseAddDonorModal = () => {
    setShowAddDonorModal(false);
    setModalSearchQuery('');
    setIsAddingDonorToList(null);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  /**
   * Handle export donor list to CSV
   */
  const handleExport = async () => {
    if (!selectedEvent) return;
    
    setExporting(true);
    
    try {
      // Call export function to generate CSV
      const blob = await exportEventDonorsToCsv(selectedEvent.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Set download attributes
      link.href = url;
      link.setAttribute('download', `${selectedEvent.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_donor_data_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      
      // Trigger download and clean up DOM
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      // Show success message highlighting active donors
      setSuccess('Successfully exported active donor data (excluding deceased donors and excluded donors)');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Failed to export donors:', error);
      
      // Special handling for no valid donors case
      if (error.message === 'No valid donors to export') {
        setError(prev => ({ ...prev, export: `No donors to export: All donors are either excluded or do not meet export criteria` }));
      } else {
        setError(prev => ({ ...prev, export: `Failed to export donors: ${error.message || 'Unknown error'}` }));
      }
      
      // Clear export error message after 5 seconds
      setTimeout(() => {
        setError(prev => ({ ...prev, export: null }));
      }, 5000);
    } finally {
      setExporting(false);
    }
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
      const result = await addDonorToEvent(selectedEvent.id, donorId);
      
      // If response includes information about newly created list, update UI
      if (result.donorList) {
        console.log('Donor list created or updated:', result.donorList);
      }
      
      // Update event donor data
      await fetchEventDonors();
      await fetchEventStats();
      
      // Remove this donor from available donors list
      setAvailableDonors(prev => prev.filter(donor => {
        const id = donor.id || donor.donor_id || donor.donorId;
        return id !== donorId;
      }));
      
      // Show success message
      setSuccess('Donor added successfully');
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh available donors list
      try {
        const updatedAvailableDonors = await getAvailableDonors(selectedEvent.id, {
          page: 1,
          limit: 100
        });
        setAvailableDonors(updatedAvailableDonors.data || []);
      } catch (refreshError) {
        console.error('Error refreshing available donors:', refreshError);
        // Error already handled, but does not affect main process
      }
    } catch (error) {
      console.error('Error adding donor to event:', error);
      
      // Special handling for donors already in the event
      if (error.message && error.message.includes('already in this event')) {
        setError(prev => ({ ...prev, donors: 'This donor is already in this event' }));
      } else {
        setError(prev => ({ ...prev, donors: 'Failed to add donor: ' + (error.message || 'Unknown error') }));
      }
      
      // Refresh donor list to ensure UI consistency
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
    
    // Confirm donor removal
    if (!window.confirm('Are you sure you want to remove this donor from the event?')) {
      return;
    }

    try {
      setLoading(prev => ({ ...prev, donors: true }));
      
      // Call API to remove donor from event
      await removeDonorFromEvent(selectedEvent.id, eventDonorId);
      
      // Update data
      fetchEventDonors();
      fetchEventStats();
      
      // Show success message
      setSuccess('Donor removed successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error removing donor from event:', error);
      setError(prev => ({ ...prev, donors: 'Failed to remove donor: ' + (error.message || 'Unknown error') }));
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

  // 添加一个重试功能的函数
  const handleRetryFetchDonors = () => {
    // 可以添加延迟重试或其他逻辑
    console.log('Retrying to fetch donors...');
    fetchEventDonors();
  };

  /**
   * Open the status edit modal for a donor
   * @param {Object} donor - The donor to edit status for
   */
  const handleOpenStatusModal = (donor) => {
    if (selectedEvent.status !== 'active') {
      alert('Only events in Ready status can edit donor information');
      return;
    }
    console.log('Opening status modal for donor:', donor);
    setSelectedDonor(donor);
    setShowStatusModal(true);
  };

  /**
   * Close the status edit modal
   */
  const handleCloseStatusModal = () => {
    setShowStatusModal(false);
    setSelectedDonor(null);
    setEditStatus('');
    setEditComments('');
    setEditExcludeReason('');
  };

  /**
   * Update donor status and comments
   */
  const handleUpdateStatus = async () => {
    if (!selectedDonor || !selectedEvent) {
      console.error('Missing selectedDonor or selectedEvent', { selectedDonor, selectedEvent });
      return;
    }

    try {
      setLoading(prev => ({ ...prev, donors: true }));
      
      // Ensure we're using the correct ID (eventDonor ID, not donor ID)
      const eventDonorId = selectedDonor.id;
      const eventId = selectedEvent.id;
      
      // Log the donor and event IDs being used
      console.log('Updating donor:', {
        eventId,
        eventDonorId,
        status: editStatus,
        comments: editComments,
        excludeReason: editExcludeReason,
        selectedDonor // Log the full selectedDonor object for debugging
      });
      
      // Prepare update data
      const updateData = {
        status: editStatus,
        comments: editComments
      };
      
      // Only include exclude_reason if status is Excluded
      if (editStatus === 'Excluded') {
        updateData.exclude_reason = editExcludeReason || 'Excluded by user';
      }
      
      // Call API to update donor information
      await updateEventDonor(eventId, eventDonorId, updateData);
      
      // Update succeeded, refresh donor data and stats
      await fetchEventDonors();
      await fetchEventStats();
      
      // Show success message
      setSuccess('Donor information updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      
      // Close the modal
      handleCloseStatusModal();
    } catch (error) {
      console.error('Error updating donor information:', error);
      setError(prev => ({ ...prev, donors: 'Failed to update donor: ' + (error.message || 'Unknown error') }));
    } finally {
      setLoading(prev => ({ ...prev, donors: false }));
    }
  };

  // Check if the selected event is in Ready status
  const isEventReady = () => {
    if (!selectedEvent) return false;
    console.log('Checking event status:', selectedEvent.status);
    return selectedEvent.status === 'active';
  };

  // handle status filter
  const handleStatusFilter = (status) => {
    setStatusFilter(status === statusFilter ? '' : status);
  };

  // filter donors based on search query and status filter
  const filteredDonors = eventDonors.filter(donor => {
    const searchTerm = searchQuery.toLowerCase();
    const firstName = (donor.firstName || '').toLowerCase();
    const lastName = (donor.lastName || '').toLowerCase();
    const organizationName = (donor.organizationName || '').toLowerCase();
    
    const matchesSearch = searchQuery === '' || 
      firstName.includes(searchTerm) ||
      lastName.includes(searchTerm) ||
      organizationName.includes(searchTerm);
    
    const matchesStatus = statusFilter === '' || donor.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  /**
   * Refresh available donors list
   */
  const handleRefreshAvailableDonors = async () => {
    if (!selectedEvent) return;
    
    setIsRefreshing(true);
    
    try {
      // refresh available donors list
      const refreshedDonors = await getAvailableDonors(selectedEvent.id, {
        page: 1,
        limit: 100
      });
      setAvailableDonors(refreshedDonors.data || []);
    } catch (error) {
      console.error('Error refreshing available donors:', error);
      setError(prev => ({ ...prev, availableDonors: 'Failed to refresh donor list' }));
    } finally {
      setIsRefreshing(false);
    }
  };

  // 添加模态框搜索处理函数
  const handleModalSearch = async (e) => {
    const searchValue = e.target.value;
    setModalSearchQuery(searchValue);
    
    if (!selectedEvent) return;
    
    try {
      setLoading(prev => ({ ...prev, availableDonors: true }));
      setError(prev => ({ ...prev, availableDonors: null }));
      
      const result = await getAvailableDonors(selectedEvent.id, {
        page: 1,
        limit: modalItemsPerPage,
        search: searchValue
      });
      
      setAvailableDonors(result.data || []);
      setModalCurrentPage(1);
      setModalTotalPages(result.total_pages || 1);
      setModalTotalDonors(result.total_count || 0);
    } catch (error) {
      console.error('Error searching available donors:', error);
      setError(prev => ({ ...prev, availableDonors: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, availableDonors: false }));
    }
  };

  // 过滤可用捐赠者列表
  const filteredAvailableDonors = availableDonors.filter(donor => {
    if (!donor || typeof donor !== 'object') {
      console.warn('Invalid donor object:', donor);
      return false;
    }
    
    const searchTerm = modalSearchQuery.toLowerCase();
    
    // 安全地访问可能为null的字段
    const firstName = String(donor.firstName || '').toLowerCase();
    const lastName = String(donor.lastName || '').toLowerCase();
    const organizationName = String(donor.organizationName || '').toLowerCase();
    
    return firstName.includes(searchTerm) ||
      lastName.includes(searchTerm) ||
      organizationName.includes(searchTerm);
  });

  const handleAddDonorToList = async (donor) => {
    if (!selectedEvent) return;
    
    try {
      setIsAddingDonorToList(donor.id);
      await addDonorToEvent(selectedEvent.id, donor.id);
      setSuccess('Donor added successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      await Promise.all([
        fetchEventDonors(),
        handleRefreshAvailableDonors(),
        fetchEventStats()
      ]);
    } catch (err) {
      setError(prev => ({ ...prev, donors: err.message }));
    } finally {
      setIsAddingDonorToList(null);
    }
  };

  const handleModalPageChange = async (newPage) => {
    if (!selectedEvent) return;
    
    try {
      setLoading(prev => ({ ...prev, availableDonors: true }));
      setError(prev => ({ ...prev, availableDonors: null }));
      
      const result = await getAvailableDonors(selectedEvent.id, {
        page: newPage,
        limit: modalItemsPerPage,
        search: modalSearchQuery
      });
      
      setAvailableDonors(result.data || []);
      setModalCurrentPage(newPage);
      setModalTotalPages(result.total_pages || 1);
      setModalTotalDonors(result.total_count || 0);
    } catch (error) {
      console.error('Error fetching available donors:', error);
      setError(prev => ({ ...prev, availableDonors: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, availableDonors: false }));
    }
  };

  // 添加批量添加捐赠者的函数
  const handleAddMultipleDonors = async () => {
    if (!selectedEvent || selectedDonors.length === 0) return;
    
    try {
      setLoading(prev => ({ ...prev, donors: true }));
      
      // 批量添加捐赠者
      await Promise.all(selectedDonors.map(donor => 
        addDonorToEvent(selectedEvent.id, donor.id)
      ));
      
      setSuccess(`${selectedDonors.length} donors added successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      
      // 更新UI
      await Promise.all([
        fetchEventDonors(),
        handleRefreshAvailableDonors(),
        fetchEventStats()
      ]);
      
      // 清空选中状态
      setSelectedDonors([]);
    } catch (err) {
      setError(prev => ({ ...prev, donors: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, donors: false }));
    }
  };

  // 添加处理选中状态的函数
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

  const handleDonorAdded = async () => {
    try {
      // 重新获取活动的捐赠者列表
      await fetchEventDonors();
      // 更新统计信息
      await fetchEventStats();
      // 显示成功消息
      setSuccess('Donor added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error refreshing donor lists:', error);
      setError(prev => ({ ...prev, donors: 'Failed to refresh donor list' }));
    }
  };
  
  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(dropdownSearch.toLowerCase())
  );

  return (
    <div className="donors-container">
      <header className="donors-header">
        <div>
          <h1>Donor Management</h1>
          <p>View and manage donor lists for upcoming events</p>
        </div>
        <button 
          className="export-button" 
          onClick={handleExport} 
          disabled={loading.donors || !selectedEvent || !isEventReady()}
          title={!selectedEvent ? "Select an event to export donors" : !isEventReady() ? "Only Ready events can export donors" : "Export donors to CSV"}
        >
          {exporting ? (
            <div className="export-loading">
              <FaSpinner className="loading-spinner" /> Exporting...
            </div>
          ) : (
            <>
              <FaDownload /> Export Donors
            </>
          )}
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
                  {/* NEW: Dropdown search input */}
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={dropdownSearch}
                    onChange={(e) => setDropdownSearch(e.target.value)}
                    className="dropdown-search-input"
                  />
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
                    filteredEvents.map(event => (
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
                disabled={!selectedEvent || !isEventReady()}
                title={!isEventReady() ? "Only Ready events can add donors" : "Add a new donor"}
              >
                <FaPlus /> Add Donor
              </button>
            </div>
          </div>

          <div className="donor-stats">
            {loading.stats ? (
              <div className="loading-indicator stats-loading">
                <FaSpinner className="spinner" />
              </div>
            ) : error.stats ? (
              <div className="error-message stats-error">
                <p>{error.stats}</p>
                <button onClick={fetchEventStats} className="retry-button-small">Retry</button>
              </div>
            ) : (
              <>
                <div 
                  className={`stat-item pending ${statusFilter === 'Pending' ? 'active' : ''}`}
                  onClick={() => handleStatusFilter('Pending')}
                >
                  <div className="stat-number">{stats.pending}</div>
                  <div className="stat-label">Pending</div>
                </div>
                <div 
                  className={`stat-item approved ${statusFilter === 'Approved' ? 'active' : ''}`}
                  onClick={() => handleStatusFilter('Approved')}
                >
                  <div className="stat-number">{stats.approved}</div>
                  <div className="stat-label">Approved</div>
                </div>
                <div 
                  className={`stat-item excluded ${statusFilter === 'Excluded' ? 'active' : ''}`}
                  onClick={() => handleStatusFilter('Excluded')}
                >
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
            
            {/* Error message display */}
            {error.donors && (
              <div className="error-message">
                <p>{error.donors}</p>
                <p className="error-hint">
                  {error.donors.includes('Unable to create donor list') || error.donors.includes('Server internal error') ? 
                    'Tip: There may be a database field issue on the server. You can try clicking retry, or contact the system administrator to fix field errors in the server code.' : 
                    'Please try refreshing the page or try again later.'}
                </p>
                <div className="error-actions">
                  <button onClick={handleRetryFetchDonors}>Retry</button>
                  <button onClick={() => window.location.reload()}>Refresh Page</button>
                </div>
              </div>
            )}
            
            {/* Success message display */}
            {success && (
              <div className="success-message">
                <p>{success}</p>
              </div>
            )}
            
            {!loading.donors && !error.donors && (
              <>
                {filteredDonors.length === 0 ? (
                  <div className="no-donors-message">
                    <button 
                      className="add-donor-button-large"
                      onClick={handleOpenAddDonorModal}
                      disabled={!selectedEvent || !isEventReady()}
                    >
                      <FaPlus /> Add Your First Donor
                    </button>
                  </div>
                ) : (
                  <DonorList
                    donors={filteredDonors}
                    onRemove={handleRemoveDonor}
                    onStatusUpdate={handleOpenStatusModal}
                    isEventReady={isEventReady()}
                    loading={loading.donors}
                    formatDate={formatDate}
                  />
                )}
              </>
            )}
          </div>

          {!loading.donors && !error.donors && filteredDonors.length > 0 && (
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

        <EventDetail 
          selectedEvent={selectedEvent}
          loading={loading}
          error={error}
          fetchEvents={fetchEvents}
          formatDate={formatDate}
          events={events} // 添加所有事件数据
          onEventSelect={handleRelatedEventSelect} // 添加事件选择处理函数
        />
      </div>

      {/* Add Donor Modal */}
      <AddDonorModal
        isOpen={showAddDonorModal}
        onClose={() => setShowAddDonorModal(false)}
        eventId={selectedEvent?.id}
        onDonorAdded={handleDonorAdded}
        currentEventDonors={eventDonors}
      />

      {/* Status Edit Modal */}
      {showStatusModal && selectedDonor && (
        <div className="modal-overlay">
          <div className="modal-content status-modal">
            <div className="modal-header">
              <h3>Edit Donor Status</h3>
              <button className="close-button" onClick={handleCloseStatusModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="donor-profile-simple">
                <h4>{selectedDonor.donor?.firstName || selectedDonor.firstName} {selectedDonor.donor?.lastName || selectedDonor.lastName}</h4>
                {(selectedDonor.donor?.organizationName || selectedDonor.organizationName) && (
                  <p className="org-name">{selectedDonor.donor?.organizationName || selectedDonor.organizationName}</p>
                )}
              </div>
              
              <div className="status-section">
                <h4>Update Status</h4>
                <div className="status-options">
                  <label className={`status-option ${editStatus === 'Pending' ? 'selected' : ''}`}>
                    <input 
                      type="radio" 
                      name="status" 
                      value="Pending" 
                      checked={editStatus === 'Pending'} 
                      onChange={() => setEditStatus('Pending')} 
                    />
                    <div className="status-card pending">
                      <span className="status-label">Pending</span>
                    </div>
                  </label>
                  
                  <label className={`status-option ${editStatus === 'Approved' ? 'selected' : ''}`}>
                    <input 
                      type="radio" 
                      name="status" 
                      value="Approved" 
                      checked={editStatus === 'Approved'} 
                      onChange={() => setEditStatus('Approved')} 
                    />
                    <div className="status-card approved">
                      <span className="status-label">Approved</span>
                    </div>
                  </label>
                  
                  <label className={`status-option ${editStatus === 'Excluded' ? 'selected' : ''}`}>
                    <input 
                      type="radio" 
                      name="status" 
                      value="Excluded" 
                      checked={editStatus === 'Excluded'} 
                      onChange={() => setEditStatus('Excluded')} 
                    />
                    <div className="status-card excluded">
                      <span className="status-label">Excluded</span>
                    </div>
                  </label>
                </div>
              </div>
              
              {editStatus === 'Excluded' && (
                <div className="exclude-reason-section">
                  <label htmlFor="exclude-reason">Exclusion Reason:</label>
                  <input
                    id="exclude-reason"
                    type="text"
                    placeholder="Enter reason for excluding this donor"
                    value={editExcludeReason}
                    onChange={(e) => setEditExcludeReason(e.target.value)}
                    className="exclude-reason-input"
                  />
                </div>
              )}
              
              <div className="comments-section">
                <label htmlFor="donor-comments">Comments:</label>
                <textarea
                  id="donor-comments"
                  placeholder="Add notes about this donor"
                  value={editComments}
                  onChange={(e) => setEditComments(e.target.value)}
                  className="comments-textarea"
                  rows={4}
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  className="cancel-button" 
                  onClick={handleCloseStatusModal}
                >
                  Cancel
                </button>
                <button 
                  className="save-button" 
                  onClick={handleUpdateStatus}
                  disabled={loading.donors}
                >
                  {loading.donors ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Donors; 