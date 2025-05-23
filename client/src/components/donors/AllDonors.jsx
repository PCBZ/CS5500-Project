import React, { useState, useEffect, useCallback } from 'react';
import {
  FaSearch,
  FaSpinner,
  FaDownload,
  FaSync,
  FaCheckCircle,
} from 'react-icons/fa';
import {
  getAllDonors,
  exportDonorsToCsv,
  updateDonor,
  deleteDonor
} from '../../services/donorService';
import DonorListItem from './DonorListItem';
import EditDonorModal from './EditDonorModal';
import ImportDonors from './ImportDonors'; // Import the component
import './AllDonors.css';
import '../../styles/common.css';
import { useNavigate } from 'react-router-dom';

const AllDonors = () => {
  const [donors, setDonors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDonors, setTotalDonors] = useState(0);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [donorToDelete, setDonorToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [importing] = useState(false);

  const navigate = useNavigate();
  
  // Filter state
  const [filters, setFilters] = useState({
    city: '',
    minDonation: '',
    pmm: '',
    excluded: '',
    deceased: '',
    tags: ''
  });
  // Remove toggling; the filter panel will always be visible.
  // (If you still have a toggleFilters function/state elsewhere, ignore it.)

  const fetchDonors = useCallback(async () => {
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
  }, [currentPage, itemsPerPage, searchQuery, filters]);

  useEffect(() => {
    fetchDonors();
  }, [fetchDonors]);
  
  // Filter and search handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const applyFilters = (e) => {
    e.preventDefault();
    setCurrentPage(1);
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
  
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDonors();
  };
  
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };
  
  // Export handler
  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportDonorsToCsv();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `all_donors_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      setSuccess('Successfully exported all donor data');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Failed to export donors:', error);
      setError('Failed to export donor data: ' + (error.message || 'Unknown error'));
      setTimeout(() => setError(null), 5000);
    } finally {
      setExporting(false);
    }
  };
  
  const generatePaginationArray = () => {
    const maxPageButtons = 5;
    const pageButtons = [];
    
    if (totalPages <= maxPageButtons) {
      for (let i = 1; i <= totalPages; i++) {
        pageButtons.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageButtons.push(i);
        }
        pageButtons.push('...');
        pageButtons.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageButtons.push(1);
        pageButtons.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageButtons.push(i);
        }
      } else {
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
  
  const handleRetry = () => {
    fetchDonors();
  };
  
  // Edit & delete donor handlers
  const handleEditClick = (donor) => {
    setSelectedDonor(donor);
    setIsEditModalOpen(true);
  };
  
  const handleSaveDonor = async (donorId, donorData) => {
    try {
      console.log('Saving donor changes:', donorId, donorData);
      const updatedDonor = await updateDonor(donorId, donorData);
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
      if (err.message && (err.message.includes('session') || err.message.includes('token') || err.message.includes('non-JSON'))) {
        setError('Session error: ' + err.message);
      } else {
        setError('Failed to update donor: ' + (err.message || 'Unknown error'));
      }
      setTimeout(() => setError(null), 5000);
      throw err;
    }
  };

  const handleDeleteClick = (donor) => {
    setDonorToDelete(donor);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      console.log('Deleting donor:', donorToDelete);
      if (!donorToDelete || !donorToDelete.id) {
        throw new Error('Invalid donor data');
      }
      const result = await deleteDonor(donorToDelete.id);
      if (result.success) {
        setShowDeleteConfirm(false);
        setDonorToDelete(null);
        setSuccess('Donor deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
        fetchDonors();
      } else {
        throw new Error(result.message || 'Failed to delete donor');
      }
    } catch (error) {
      console.error('Error deleting donor:', error);
      setError(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="all-donors-container">
      {/* Unified Top Panel: Merges header, search/actions, and filter panel */}
      <div className="all-donors-top-panel" style={{
        backgroundColor: '#ffffff',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        marginBottom: '1.5rem'
      }}>
        <h1 style={{ marginBottom: '1rem' }}>All Donors</h1>
        <div className="top-controls" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Search and Action Buttons Section */}
          <div className="all-donors-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div className="search-bar">
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
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

            {/* Removed toggle filters button; filter panel is always shown */}
            <ImportDonors 
              onImportSuccess={(result) => {
                setSuccess(`Import successful! Imported ${result.imported} records, updated ${result.updated} records.`);
                setTimeout(() => setSuccess(''), 5000);
                fetchDonors();
              }}
              onImportError={(error) => {
                setError(error.message);
                setTimeout(() => setError(null), 5000);
              }}
              buttonText={importing ? 'Importing...' : 'Import'}
              disabled={importing}
            />
            
            <button 
              className="action-button export-button" 
              onClick={handleExport} 
              disabled={exporting}
              title="Export data to CSV"
            >
              <FaDownload /> {exporting ? 'Exporting...' : 'Export'}
            </button>
            
            <button 
              className="action-button all-donors-refresh-button" 
              onClick={handleRetry} 
              disabled={loading}
              title="Refresh data"
            >
              <FaSync className={loading ? 'spinning' : ''} /> {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Filter Panel (Always Open) */}
          <div className="filter-container" style={{ width: '100%' }}>
            <form onSubmit={applyFilters}>
              <div className="filter-form" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
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
              
              <div className="filter-actions" style={{ marginTop: '1rem' }}>
                <button type="submit" className="apply-filter-button">
                  Apply Filters
                </button>
                <button type="button" className="reset-filter-button" onClick={resetFilters}>
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

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
            <button onClick={() => navigate('/login')} className="login-button">
              Login Again
            </button>
          ) : (
            <button onClick={handleRetry} className="retry-button">
              Retry
            </button>
          )}
        </div>
      )}
      
      <div className="all-donors-list-container">
        {loading ? (
          <div className="loading-indicator">
            <FaSpinner className="spinner" />
            <p>Loading donor data...</p>
          </div>
        ) : donors.length > 0 ? (
          <>
            <div className="donors-count">
              Showing {donors.length} donors out of {totalDonors} total
            </div>
            <div className="all-donors-table-container">
              <table className="all-donors-table">
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
                      onDelete={handleDeleteClick}
                      isDeleting={isDeleting && donorToDelete?.id === donor.id}
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
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && donorToDelete && (
        <div className="modal-overlay">
          <div className="modal-container delete-modal">
            <h3>Delete Donor</h3>
            <p>Are you sure you want to delete the donor "{donorToDelete.firstName} {donorToDelete.lastName}"?</p>
            <p className="warning-text">This action cannot be undone.</p>
            <div className="modal-buttons">
              <button 
                className="cancel-button" 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDonorToDelete(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="delete-button" 
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

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