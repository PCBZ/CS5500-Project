import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaSpinner, FaDownload, FaSync, FaCheckCircle, FaFilter, FaUpload } from 'react-icons/fa';
import { getAllDonors, exportDonorsToCsv, updateDonor, importDonors } from '../../services/donorService';
import { formatCurrency } from '../../utils/formatters';
import DonorListItem from './DonorListItem';
import EditDonorModal from './EditDonorModal';
import './AllDonors.css';

const AllDonors = () => {
  const [donors, setDonors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDonors, setTotalDonors] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState('');
  const [importing, setImporting] = useState(false);

  const fileInputRef = useRef(null);
  
  // 添加过滤器状态
  const [filters, setFilters] = useState({
    city: '',
    minDonation: '',
    pmm: '',
    excluded: '',
    deceased: '',
    tags: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  
  // Fetch all donor data
  useEffect(() => {
    fetchDonors();
  }, [searchQuery, currentPage, filters]);
  
  // Get donor list
  const fetchDonors = async () => {
    setLoading(true);
    setError(null);


    
    try {
      const queryParams = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
        city: filters.city || undefined,
        minDonation: filters.minDonation || undefined,
        pmm: filters.pmm || undefined,
        excluded: filters.excluded || undefined,
        deceased: filters.deceased || undefined,
        tags: filters.tags || undefined
      };
      
      console.log('Fetching donors with params:', queryParams);
      const response = await getAllDonors(queryParams);
      
      console.log("Donors response:", response);
      console.log("Donor data sample:", response.data.length > 0 ? response.data[0] : "No donors");
      
      setDonors(response.data || []);
      setTotalPages(response.total_pages || 1);
      setTotalDonors(response.total_count || 0);
    } catch (err) {
      console.error('Failed to fetch donors:', err);
      setError('Failed to load donor list: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  // 在其他处理函数附近添加
// Trigger file selection
const handleImportClick = () => {
  fileInputRef.current.click();
};

// Handle import file change
const handleFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  // Check file extension
  const fileExtension = file.name.split('.').pop().toLowerCase();
  if (fileExtension !== 'csv' && fileExtension !== 'xlsx' && fileExtension !== 'xls') {
    setError('Please select a CSV or Excel file.');
    setTimeout(() => setError(null), 5000);
    e.target.value = null; // Reset file input
    return;
  }
  
  // Check file size (limit to 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    setError('File size exceeds the limit (10MB). Please select a smaller file.');
    setTimeout(() => setError(null), 5000);
    e.target.value = null; // Reset file input
    return;
  }
  
  setImporting(true);
  setError(null);
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add file type hint for server processing
    if (fileExtension === 'csv') {
      formData.append('fileType', 'csv');
    } else {
      formData.append('fileType', 'excel');
    }
    
    const result = await importDonors(formData);
    
    if (result.success) {
      setSuccess(`Import successful! Imported ${result.imported} records, updated ${result.updated} records.`);
      
      // If there are errors, show more details
      if (result.errors && result.errors.length > 0) {
        console.warn('Import completed with errors:', result.errors);
        setError(`Import completed with ${result.errors.length} errors. Check the console for details.`);
        setTimeout(() => setError(null), 8000);
      }
      
      setTimeout(() => setSuccess(''), 5000);
      
      // Refresh donor list
      fetchDonors();
    } else {
      throw new Error(result.message || 'Import failed');
    }
  } catch (err) {
    console.error('Import failed:', err);
    setError('Import failed: ' + (err.message || 'Unknown error'));
    setTimeout(() => setError(null), 5000);
  } finally {
    setImporting(false);
    e.target.value = null; // Reset file input
  }
};

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const applyFilters = (e) => {
    e.preventDefault();
    setCurrentPage(1); // 重置到第一页
    fetchDonors();
  };
  
  const resetFilters = () => {
    setFilters({
      city: '',
      minDonation: '',
      pmm: '',
      excluded: '',
      deceased: '',
      tags: ''
    });
    setCurrentPage(1);
  };
  
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page
    fetchDonors();
  };
  
  // Handle page change
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };
  
  // Export to CSV
  const handleExport = async () => {
    setExporting(true);
    
    try {
      const result = await exportDonorsToCsv();
      
      if (result.success) {
        // Create download link
        const url = window.URL.createObjectURL(new Blob([result.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', result.fileName || 'all_donors.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setSuccess('Export successful!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error(result.message || 'Export failed');
      }
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export donor data: ' + (err.message || 'Unknown error'));
      setTimeout(() => setError(null), 5000);
    } finally {
      setExporting(false);
    }
  };
  
  // Generate pagination array
  const generatePaginationArray = () => {
    const maxPageButtons = 5;
    const pageButtons = [];
    
    if (totalPages <= maxPageButtons) {
      // If total pages is less than or equal to max buttons, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageButtons.push(i);
      }
    } else {
      // If total pages is greater than max buttons, need smart display
      if (currentPage <= 3) {
        // Current page is near the beginning
        for (let i = 1; i <= 4; i++) {
          pageButtons.push(i);
        }
        pageButtons.push('...');
        pageButtons.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Current page is near the end
        pageButtons.push(1);
        pageButtons.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageButtons.push(i);
        }
      } else {
        // Current page is in the middle
        pageButtons.push(1);
        pageButtons.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageButtons.push(i);
        }
        pageButtons.push('...');
        pageButtons.push(totalPages);
      }
    }
    
    return pageButtons;
  };
  
  // Retry loading
  const handleRetry = () => {
    fetchDonors();
  };
  
  // Handle edit button click
  const handleEditClick = (donor) => {
    setSelectedDonor(donor);
    setIsEditModalOpen(true);
  };
  
  // Handle save donor changes
  const handleSaveDonor = async (donorId, donorData) => {
    try {
      console.log('Saving donor changes:', donorId, donorData);
      const updatedDonor = await updateDonor(donorId, donorData);
      
      // Update the donor in the local state
      setDonors(prevDonors => 
        prevDonors.map(donor => 
          donor.id === donorId ? { ...donor, ...updatedDonor } : donor
        )
      );
      
      setSuccess('Donor updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      return updatedDonor;
    } catch (err) {
      console.error('Failed to update donor:', err);
      
      // Check if we need to refresh the token/session
      if (err.message && (
        err.message.includes('session') || 
        err.message.includes('token') || 
        err.message.includes('non-JSON'))) {
        setError('Session error: ' + err.message);
      } else {
        setError('Failed to update donor: ' + (err.message || 'Unknown error'));
      }
      
      setTimeout(() => setError(null), 5000);
      throw err;
    }
  };
  
  return (
    <div className="donors-container">
      <div className="donors-header">
        <h1>All Donors</h1>
        
        <div className="donors-actions">
          <div className="search-bar">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search donors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-button">
                <FaSearch />
              </button>
            </form>
          </div>
          
          <button
            className="action-button filter-button"
            onClick={toggleFilters}
            title="Toggle filter options"
          >
            <FaFilter /> Filters
          </button>

          <button 
            className="action-button import-button" 
            onClick={handleImportClick} 
            disabled={importing}
            title="From CSV or Excel import donors data"
          >
            {importing ? (
              <div className="import-loading">
                <FaSpinner className="spinner" /> importing...
              </div>
            ) : (
              <>
                <FaUpload /> imported
              </>
            )}
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept=".csv,.xlsx,.xls"
          />
          
          <button 
            className="action-button export-button" 
            onClick={handleExport} 
            disabled={exporting || donors.length === 0}
            title="Export data to CSV"
          >
            {exporting ? (
              <div className="export-loading">
                <FaSpinner className="spinner" /> Exporting...
              </div>
            ) : (
              <>
                <FaDownload /> Export
              </>
            )}
          </button>
          
          <button 
            className="action-button refresh-button" 
            onClick={handleRetry} 
            disabled={loading}
            title="Refresh data"
          >
            {loading ? <FaSpinner className="spinner" /> : <FaSync />} Refresh
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="filter-container">
          <form onSubmit={applyFilters}>
            <div className="filter-form">
              <div className="filter-group">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  className="filter-input"
                  value={filters.city}
                  onChange={handleFilterChange}
                  placeholder="Enter city"
                />
              </div>
              
              <div className="filter-group">
                <label htmlFor="minDonation">Min Donation</label>
                <input
                  type="number"
                  id="minDonation"
                  name="minDonation"
                  className="filter-input"
                  value={filters.minDonation}
                  onChange={handleFilterChange}
                  placeholder="Enter minimum amount"
                  min="0"
                />
              </div>
              
              <div className="filter-group">
                <label htmlFor="pmm">PMM</label>
                <select
                  id="pmm"
                  name="pmm"
                  className="filter-select"
                  value={filters.pmm}
                  onChange={handleFilterChange}
                >
                  <option value="">All</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="excluded">Excluded</label>
                <select
                  id="excluded"
                  name="excluded"
                  className="filter-select"
                  value={filters.excluded}
                  onChange={handleFilterChange}
                >
                  <option value="">All</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="deceased">Deceased</label>
                <select
                  id="deceased"
                  name="deceased"
                  className="filter-select"
                  value={filters.deceased}
                  onChange={handleFilterChange}
                >
                  <option value="">All</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="tags">Tags</label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  className="filter-input"
                  value={filters.tags}
                  onChange={handleFilterChange}
                  placeholder="Tags (comma separated)"
                />
              </div>
            </div>
            
            <div className="filter-actions">
              <button type="submit" className="apply-filter-button">Apply Filters</button>
              <button type="button" className="reset-filter-button" onClick={resetFilters}>Reset</button>
            </div>
          </form>
        </div>
      )}
      
      {success && (
        <div className="success-message">
          <FaCheckCircle style={{ marginRight: '0.5rem' }} />
          {success}
        </div>
      )}
      
      {error && (
        <div className="error-container">
          <p className="error-message">{error}</p>
          {error.includes('Session error') ? (
            <button onClick={() => window.location.href = '/login'} className="login-button">
              Login Again
            </button>
          ) : (
            <button onClick={handleRetry} className="retry-button">
              Retry
            </button>
          )}
        </div>
      )}
      
      <div className="donors-list-container">
        {loading ? (
          <div className="loading-indicator donors-loading">
            <FaSpinner className="spinner" />
            <p>Loading donor data...</p>
          </div>
        ) : donors.length > 0 ? (
          <>
            <div className="donors-count">
              Showing {donors.length} donors out of {totalDonors} total
            </div>
            
            <div className="donors-table-container">
              <table className="donors-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>City</th>
                    <th>Total Donations</th>
                    <th>Total Pledges</th>
                    <th>Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {donors.map(donor => (
                    <DonorListItem 
                      key={donor.id}
                      donor={donor}
                      onEdit={handleEditClick}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-button"
                title="Previous page"
              >
                Previous
              </button>
              
              {generatePaginationArray().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' ? handlePageChange(page) : null}
                  disabled={page === '...'}
                  className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-button"
                title="Next page"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div className="no-donors-message">
            <p>No donor data found</p>
            {searchQuery && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setTimeout(fetchDonors, 0);
                }} 
                className="clear-search-button"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Edit Donor Modal */}
      {selectedDonor && (
        <EditDonorModal
          donor={selectedDonor}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedDonor(null);
          }}
          onSave={handleSaveDonor}
        />
      )}
    </div>
  );
};

export default AllDonors; 