/**
 * Format a date string to a human-readable format
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'Date not set';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format a currency value
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Format donor name based on organization or individual
 * @param {Object} donor - The donor object
 * @returns {string} Formatted donor name
 */
export const formatDonorName = (donor) => {
  // If organizationName exists, it's an organization donor
  if (donor.organizationName) {
    return donor.organizationName;
  }
  
  // Otherwise construct name from firstName and lastName
  let name = '';
  if (donor.firstName) name += donor.firstName;
  if (donor.firstName && donor.lastName) name += ' ';
  if (donor.lastName) name += donor.lastName;
  
  return name || 'Unnamed Donor';
};

/**
 * Format donor address from address lines
 * @param {Object} donor - The donor object
 * @returns {string} Formatted address
 */
export const formatAddress = (donor) => {
  const parts = [];
  if (donor.addressLine1) parts.push(donor.addressLine1);
  if (donor.addressLine2) parts.push(donor.addressLine2);
  
  return parts.length > 0 ? parts.join(', ') : 'Not provided';
}; 