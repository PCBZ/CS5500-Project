import React, { useState, useRef } from 'react';
import { FaUpload, FaExclamationTriangle } from 'react-icons/fa';
import { importDonors } from '../../services/donorService';
import './ImportDonors.css';

const ImportDonors = ({ onImportSuccess, onImportError }) => {
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState('');
  const [importError, setImportError] = useState(null);
  const [currentOperation, setCurrentOperation] = useState(null);
  const fileInputRef = useRef(null);

  const resetStates = () => {
    setImporting(false);
    setImportProgress(0);
    setImportStatus('');
    setImportError(null);
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

    setImporting(true);
    setImportProgress(0);
    setImportStatus('Preparing import...');
    setImportError(null);

    try {
      const operation = await importDonors(
        file,
        (progress, message) => {
          setImportProgress(progress);
          setImportStatus(message);
        },
        (result) => {
          const { imported = 0, updated = 0, errors = [] } = result;
          setImportStatus('Import completed');
          setImportProgress(100);
          
          setTimeout(() => {
            setImporting(false);
            onImportSuccess?.({
              message: 'Import completed successfully',
              imported,
              updated,
              errors
            });
          }, 2000);

          if (errors.length > 0) {
            console.warn('Import completed with errors:', errors);
            setImportError(`Import completed with ${errors.length} errors. Check the console for details.`);
          }
        },
        (error) => {
          console.error('Import failed:', error);
          setImportError(error.message);
          onImportError?.(error);
          setImporting(false);
        }
      );

      setCurrentOperation(operation);
    } catch (error) {
      console.error('Import failed:', error);
      setImportError(error.message);
      onImportError?.(error);
      setImporting(false);
    }
  };

  const handleCancelImport = async () => {
    if (currentOperation) {
      try {
        await currentOperation.cancel();
        setImportStatus('Import cancelled');
        setTimeout(resetStates, 2000);
      } catch (error) {
        console.error('Failed to cancel import:', error);
        setImportError('Failed to cancel import: ' + error.message);
      }
    }
  };

  return (
    <div className="import-donors-container">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv,.xlsx,.xls"
        style={{ display: 'none' }}
      />
      
      <button 
        className="import-button" 
        onClick={handleImportClick} 
        disabled={importing}
        title="Import donors from CSV or Excel file"
      >
        <FaUpload /> {importing ? 'Importing...' : 'Import'}
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
                />
              </div>
              <button 
                className="cancel-button"
                onClick={handleCancelImport}
              >
                Cancel Import
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportDonors;