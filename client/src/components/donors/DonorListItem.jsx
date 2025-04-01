import React from 'react';
import PropTypes from 'prop-types';
import { FaEdit } from 'react-icons/fa';
import { formatDonorName, formatCurrency, formatAddress } from '../../utils/formatters';
import './DonorListItem.css';

const DonorListItem = ({ donor, onEdit }) => {
  return (
    <tr className="donor-row">
      <td className="donor-name-cell">
        {formatDonorName(donor)}
      </td>
      <td>{donor.city || 'Not provided'}</td>
      <td className="donation-amount">{formatCurrency(donor.totalDonations || 0)}</td>
      <td className="pledge-amount">{formatCurrency(donor.totalPledges || 0)}</td>
      <td>{formatAddress(donor)}</td>
      <td className="actions-cell">
        <div className="action-buttons">
          <button 
            className="edit-button" 
            onClick={() => onEdit(donor)}
            title="编辑捐赠者"
          >
            <FaEdit />
          </button>
        </div>
      </td>
    </tr>
  );
};

DonorListItem.propTypes = {
  donor: PropTypes.shape({
    id: PropTypes.string.isRequired,
    organizationName: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    city: PropTypes.string,
    totalDonations: PropTypes.number,
    totalPledges: PropTypes.number,
    addressLine1: PropTypes.string,
    addressLine2: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func.isRequired
};

export default DonorListItem; 