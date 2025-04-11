import React, { useState, useRef, useEffect } from 'react';
import { FaUpload, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import { ProgressPoller } from '../../utils/ProgressPoller';
import './ImportDonors.css';

const ImportDonors = ({ onImportSuccess, onImportError }) => {
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState('');
  const [importError, setImportError] = useState(null);
  const [poller, setPoller] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const fileInputRef = useRef(null);
  const maxPollingAttempts = 300; // 10 minutes at 2 second intervals

  useEffect(() => {
    console.log('Import state:', { importing, importProgress, importStatus, importError });
  }, [importing, importProgress, importStatus, importError]);

  // Clean up poller and reset states on unmount
  useEffect(() => {
    return () => {
      if (poller) {
        poller.stop();
      }
      resetStates();
    };
  }, [poller]);

  const resetStates = () => {
    setImporting(false);
    setImportProgress(0);
    setImportStatus('');
    setImportError(null);
    setCurrentFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Reset states but keep importing true
    setImportProgress(0);
    setImportStatus('');
    setImportError(null);
    setCurrentFile(file);
    
    // Check file extension
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (fileExtension !== 'csv' && fileExtension !== 'xlsx' && fileExtension !== 'xls') {
      setImportError('Please select a CSV or Excel file.');
      return;
    }
    
    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setImportError('File size exceeds the limit (10MB). Please select a smaller file.');
      return;
    }
    
    setImporting(true);
    setImportStatus('Preparing import...');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Get and validate token
      const token = localStorage.getItem('token');
      if (!token) {
        setImportError('You are not logged in. Please log in and try again.');
        return;
      }

      // Start the import and get operation ID
      const response = await fetch('/api/donors/import', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Clear token and show login message
          localStorage.removeItem('token');
          setImportError('Your session has expired. Please log in again.');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || `Import failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Import response:', data);
      
      const { operationId } = data;
      if (!operationId) {
        throw new Error('No operation ID received from server');
      }

      // Stop any existing poller
      if (poller) {
        poller.stop();
      }

      // Create and start a new progress poller
      const newPoller = new ProgressPoller(
        operationId,
        (progressData) => {
          console.log('Progress update received:', progressData);
          if (!progressData) {
            console.error('Received empty progress data');
            return;
          }
          setImportProgress(progressData.progress || 0);
          setImportStatus(progressData.message || 'Processing...');
          // Keep importing true while processing
          if (progressData.status === 'processing') {
            setImporting(true);
          }
        },
        (completeData) => {
          console.log('Import completed:', completeData);
          
          if (completeData.status === 'error') {
            const errorMessage = completeData.message || 'Import failed';
            setImportError(errorMessage);
            onImportError?.({ message: errorMessage });
          } else if (completeData.status === 'cancelled') {
            setImportStatus('Import cancelled');
            onImportSuccess?.({ message: 'Import cancelled', imported: 0, updated: 0 });
          } else {
            const result = completeData.result || {};
            onImportSuccess?.(result);
            
            if (result.errors && result.errors.length > 0) {
              console.warn('Import completed with errors:', result.errors);
              setImportError(`Import completed with ${result.errors.length} errors. Check the console for details.`);
            }
          }
          // Only set importing to false after a delay to show completion
          setTimeout(() => {
            setImporting(false);
          }, 2000); // Increased delay to 2 seconds
        },
        (error) => {
          console.error('Progress polling error:', error);
          const errorMessage = error.message === 'Not authorized, token failed' 
            ? 'Your session has expired. Please log in again.'
            : `Import monitoring failed: ${error.message}. Please check status manually.`;
          setImportError(errorMessage);
          onImportError?.({ message: errorMessage });
          // Keep importing true if there's an error
          setImporting(true);
        },
        maxPollingAttempts
      ).start();
      
      setPoller(newPoller);
        
    } catch (err) {
      console.error('Import failed:', err);
      setImportError(err.message);
      onImportError?.(err);
      // Keep importing true if there's an error
      setImporting(true);
    }
  };

  const handleCancelImport = async () => {
    if (poller) {
      try {
        const operationId = poller.getOperationId();
        if (operationId) {
          await fetch(`/api/progress/${operationId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
        }
      } catch (error) {
        console.error('Error cancelling import:', error);
      }
      
      poller.stop();
      setPoller(null);
    }
    // Don't reset states immediately, let the completion handler do it
    setImportStatus('Cancelling import...');
  };

  return (
    <div className="import-donors-container">
      <button 
        className="import-button" 
        onClick={handleImportClick} 
        disabled={importing}
        title="Import donors from CSV or Excel file"
      >
        {importing ? (
          <div className="import-loading">
            <FaSpinner className="spinner" /> Importing...
          </div>
        ) : (
          <>
            <FaUpload /> Import
          </>
        )}
      </button>

      {(importing || importError) && (
        <div className="import-progress-container">
          {importError && (
            <div className="import-error">
              <FaExclamationTriangle className="error-icon" />
              <span>{importError}</span>
            </div>
          )}
          
          {importing && (
            <>
              <div className="import-progress-info">
                <span className="import-progress-percentage">
                  {Math.round(importProgress)}%
                </span>
                <span className="import-progress-status">
                  {importStatus || 'Processing...'}
                </span>
              </div>
              <div className="import-progress-bar-wrapper">
                <div 
                  className={`import-progress-bar ${
                    importError ? 'error' : 
                    importProgress === 100 ? 'completed' : 
                    'processing'
                  }`}
                  style={{ width: `${importProgress}%` }}
                ></div>
              </div>
              <button 
                className="cancel-import-button" 
                onClick={handleCancelImport}
                disabled={!importing}
              >
                Cancel Import
              </button>
            </>
          )}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".csv,.xlsx,.xls"
      />
    </div>
  );
}

export default ImportDonors;