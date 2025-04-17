import React from 'react';
import PropTypes from 'prop-types';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { formatDonorName, formatCurrency, formatAddress } from '../../utils/formatters';
import './DonorListItem.css';

const DonorListItem = ({ donor, onEdit, onDelete, isDeleting }) => {
  return (
    <tr className="donor-list-item-row">
      <td>{donor.firstName} {donor.lastName}</td>
      <td>{donor.city}</td>
      <td>${donor.totalDonations?.toLocaleString() || 0}</td>
      <td>${donor.totalPledges?.toLocaleString() || 0}</td>
      <td>{donor.addressLine1}</td>
      <td>
        <div className="donor-list-item-actions">
          <button
            className="donor-list-item-action-button"
            onClick={() => onEdit(donor)}
            title="Edit donor"
          >
            <FaEdit />
          </button>
          <button
            className="donor-list-item-action-button delete"
            onClick={() => onDelete(donor)}
            title="Delete donor"
            disabled={isDeleting}
          >
            <FaTrash />
          </button>
        </div>
      </td>
    </tr>
  );
};

DonorListItem.propTypes = {
  donor: PropTypes.shape({
    id: PropTypes.string.isRequired,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    city: PropTypes.string,
    totalDonations: PropTypes.number,
    totalPledges: PropTypes.number,
    addressLine1: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isDeleting: PropTypes.bool
};

export default DonorListItem; 