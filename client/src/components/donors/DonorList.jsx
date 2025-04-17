import React from 'react';
import { FaUser, FaTrash, FaEdit } from 'react-icons/fa';
import './DonorList.css';

const DonorList = ({ 
  donors, 
  onRemove, 
  onStatusUpdate, 
  isEventReady, 
  loading,
  formatDate 
}) => {
  return (
    <div className="donor-list-container">
      <table className="donor-list-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Organization</th>
            <th>Status</th>
            <th><span style={{ whiteSpace: 'nowrap' }}>Total Donations</span></th>
            <th><span style={{ whiteSpace: 'nowrap' }}>Largest Gift</span></th>
            <th><span style={{ whiteSpace: 'nowrap' }}>Last Gift</span></th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {donors.map(donor => {
            // Extract donor data handling both flat and nested structures
            const donorData = donor.donor || donor;
            const firstName = donorData.firstName || donorData.first_name;
            const lastName = donorData.lastName || donorData.last_name;
            const organizationName = donorData.organizationName || donorData.organization_name;
            const totalDonations = donorData.totalDonations || donorData.total_donations || 0;
            const largestGift = donorData.largestGift || donorData.largest_gift || 0;
            const lastGiftAmount = donorData.lastGiftAmount || donorData.last_gift_amount || 0;
            const status = donor.status || 'Pending';
            const eventDonorId = donor.id;
            const donorId = donorData.id || donor.donor_id || donor.donorId;

            return (
              <tr key={donor.id} className="donor-row">
                <td className="donor-name-cell">
                  <div className="donor-name-wrapper">
                    <FaUser className="donor-icon" />
                    <span className="donor-name-text">{firstName} {lastName}</span>
                  </div>
                </td>
                <td className="organization-cell">{organizationName && organizationName !== "null" ? organizationName : '-'}</td>
                <td>
                  <span className={`donor-status-badge ${status.toLowerCase()}`}>
                    {status}
                  </span>
                </td>
                <td className="donation-amount black-text">${totalDonations.toLocaleString()}</td>
                <td className="donation-amount black-text">${largestGift.toLocaleString()}</td>
                <td className="donation-amount black-text">
                  {lastGiftAmount > 0 ? `$${lastGiftAmount.toLocaleString()}` : '-'}
                </td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button
                      className="donor-action-button"
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
                    <button
                      className="donor-action-button delete"
                      onClick={() => onRemove(eventDonorId)}
                      disabled={loading || !isEventReady}
                      title={!isEventReady ? "Only Ready events can remove donors" : "Remove this donor from the event"}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DonorList; 