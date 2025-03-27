import React from 'react';
import { FaUser, FaTrash, FaEdit, FaComment } from 'react-icons/fa';
import './DonorCard.css';

const DonorCard = ({ 
  donor, 
  onRemove, 
  onStatusUpdate, 
  isEventReady, 
  loading,
  formatDate 
}) => {
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
  
  // Ensure we get the correct IDs
  const eventDonorId = donor.id; // EventDonor record ID, used for updating or deleting
  const donorId = donorData.id || donor.donor_id || donor.donorId; // The actual Donor entity ID
  
  // Get status and comment from the top-level donor object
  const status = donor.status || 'Pending';
  const comments = donor.comments;

  return (
    <div className="donor-card">
      <div className="donor-card-header">
        <FaUser className="donor-icon" />
        <h3>{firstName} {lastName}</h3>
        <button 
          className="remove-donor-button"
          onClick={() => onRemove(eventDonorId)}
          disabled={loading || !isEventReady}
          title={!isEventReady ? "Only Ready events can remove donors" : "Remove this donor from the event"}
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
            <button 
              className="edit-status-button"
              onClick={() => onStatusUpdate({
                ...donor,
                id: eventDonorId,
                donor: {
                  ...donorData,
                  id: donorId
                }
              })}
              disabled={!isEventReady}
              title={!isEventReady ? "Only Ready events can edit donor status" : "Edit Status"}
            >
              <FaEdit />
            </button>
          </p>
        )}
        {comments && (
          <p className="donor-comments">
            <FaComment className="comment-icon" /> {comments}
          </p>
        )}
        {donor.exclude_reason && status === 'Excluded' && (
          <p className="donor-exclude-reason">
            <strong>Exclude Reason:</strong> {donor.exclude_reason}
          </p>
        )}
      </div>
    </div>
  );
};

export default DonorCard; 