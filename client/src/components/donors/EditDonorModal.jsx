import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaSave, FaSpinner, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import './EditDonorModal.css';

const EditDonorModal = ({ donor, onSave, onClose, isOpen }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nickName: '',
    organizationName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    contactPhoneType: '',
    phoneRestrictions: '',
    emailRestrictions: '',
    communicationRestrictions: '',
    communicationPreference: '',
    totalDonations: 0,
    totalPledges: 0,
    largestGift: 0,
    largestGiftAppeal: '',
    firstGiftDate: '',
    lastGiftDate: '',
    lastGiftAmount: 0,
    lastGiftRequest: '',
    lastGiftAppeal: '',
    pmm: '',
    smm: '',
    vmm: '',
    excluded: false,
    deceased: false,
    subscriptionEventsInPerson: '',
    subscriptionEventsMagazine: ''
  });
  
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    address: true,
    contact: true,
    donation: true,
    management: true,
    status: true,
    subscription: true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (donor) {
      setFormData({
        firstName: donor.firstName || '',
        lastName: donor.lastName || '',
        nickName: donor.nickName || '',
        organizationName: donor.organizationName || '',
        addressLine1: donor.addressLine1 || '',
        addressLine2: donor.addressLine2 || '',
        city: donor.city || '',
        contactPhoneType: donor.contactPhoneType || '',
        phoneRestrictions: donor.phoneRestrictions || '',
        emailRestrictions: donor.emailRestrictions || '',
        communicationRestrictions: donor.communicationRestrictions || '',
        communicationPreference: donor.communicationPreference || '',
        totalDonations: donor.totalDonations || 0,
        totalPledges: donor.totalPledges || 0,
        largestGift: donor.largestGift || 0,
        largestGiftAppeal: donor.largestGiftAppeal || '',
        firstGiftDate: donor.firstGiftDate ? new Date(donor.firstGiftDate).toISOString().split('T')[0] : '',
        lastGiftDate: donor.lastGiftDate ? new Date(donor.lastGiftDate).toISOString().split('T')[0] : '',
        lastGiftAmount: donor.lastGiftAmount || 0,
        lastGiftRequest: donor.lastGiftRequest || '',
        lastGiftAppeal: donor.lastGiftAppeal || '',
        pmm: donor.pmm || '',
        smm: donor.smm || '',
        vmm: donor.vmm || '',
        excluded: donor.excluded || false,
        deceased: donor.deceased || false,
        subscriptionEventsInPerson: donor.subscriptionEventsInPerson || '',
        subscriptionEventsMagazine: donor.subscriptionEventsMagazine || ''
      });
    }
  }, [donor]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else if (type === 'number') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Process data - convert dates to ISO format or null
      const processedData = {
        ...formData,
        firstGiftDate: formData.firstGiftDate ? new Date(formData.firstGiftDate).toISOString() : null,
        lastGiftDate: formData.lastGiftDate ? new Date(formData.lastGiftDate).toISOString() : null
      };
      
      console.log('Submitting donor data:', processedData);
      
      await onSave(donor.id, processedData);
      onClose();
    } catch (err) {
      console.error('Error saving donor:', err);
      let errorMessage = err.message || 'Failed to update donor';
      
      // Check for session timeout or authentication issues
      if (errorMessage.includes('non-JSON response') || 
          errorMessage.includes('401') || 
          errorMessage.includes('403')) {
        errorMessage = 'Your session may have expired. Please refresh the page and try again.';
      }
      
      setError(errorMessage);
      window.scrollTo(0, 0); // Scroll to top to show error
    } finally {
      setLoading(false);
    }
  };

  const handleLoginAgain = () => {
    // Implement login again logic
  };

  if (!isOpen) return null;

  return (
    <div className="donors-modal-overlay">
      <div className="donors-modal-container">
        <div className="donors-modal-header">
          <h2 className="donors-modal-title">Edit Donor</h2>
          <button className="donors-modal-close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        
        {error && (
          <div className="donors-error-message">
            {error}
            {error.includes('401') && (
              <button className="donors-login-again-button" onClick={handleLoginAgain}>
                Login Again
              </button>
            )}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="donors-form">
          <div className="form-section">
            <div className="section-header" onClick={() => toggleSection('basic')}>
              <h3>Basic Information</h3>
              {expandedSections.basic ? <FaChevronUp /> : <FaChevronDown />}
            </div>
            
            {expandedSections.basic && (
              <>
                <div className="form-group">
                  <label htmlFor="organizationName">Organization Name</label>
                  <input
                    type="text"
                    id="organizationName"
                    name="organizationName"
                    value={formData.organizationName && formData.organizationName !== "null" ? formData.organizationName : ''}
                    onChange={handleChange}
                    placeholder="Organization Name (if applicable)"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="First Name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Last Name"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="nickName">Nickname</label>
                  <input
                    type="text"
                    id="nickName"
                    name="nickName"
                    value={formData.nickName}
                    onChange={handleChange}
                    placeholder="Nickname"
                  />
                </div>
              </>
            )}
          </div>
          
          <div className="form-section">
            <div className="section-header" onClick={() => toggleSection('address')}>
              <h3>Address</h3>
              {expandedSections.address ? <FaChevronUp /> : <FaChevronDown />}
            </div>
            
            {expandedSections.address && (
              <>
                <div className="form-group">
                  <label htmlFor="addressLine1">Address Line 1</label>
                  <input
                    type="text"
                    id="addressLine1"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    placeholder="Street address"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="addressLine2">Address Line 2</label>
                  <input
                    type="text"
                    id="addressLine2"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    placeholder="Apt, suite, unit, etc."
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                  />
                </div>
              </>
            )}
          </div>
          
          <div className="form-section">
            <div className="section-header" onClick={() => toggleSection('contact')}>
              <h3>Contact Information</h3>
              {expandedSections.contact ? <FaChevronUp /> : <FaChevronDown />}
            </div>
            
            {expandedSections.contact && (
              <>
                <div className="form-group">
                  <label htmlFor="contactPhoneType">Phone Type</label>
                  <select
                    id="contactPhoneType"
                    name="contactPhoneType"
                    value={formData.contactPhoneType}
                    onChange={handleChange}
                  >
                    <option value="">Select Type...</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="communicationPreference">Communication Preference</label>
                  <select
                    id="communicationPreference"
                    name="communicationPreference"
                    value={formData.communicationPreference}
                    onChange={handleChange}
                  >
                    <option value="">Select Preference...</option>
                    <option value="Email">Email</option>
                    <option value="Phone">Phone</option>
                    <option value="Mail">Mail</option>
                    <option value="Any">Any</option>
                    <option value="None">None</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="phoneRestrictions">Phone Restrictions</label>
                  <input
                    type="text"
                    id="phoneRestrictions"
                    name="phoneRestrictions"
                    value={formData.phoneRestrictions}
                    onChange={handleChange}
                    placeholder="Phone restriction notes"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="emailRestrictions">Email Restrictions</label>
                  <input
                    type="text"
                    id="emailRestrictions"
                    name="emailRestrictions"
                    value={formData.emailRestrictions}
                    onChange={handleChange}
                    placeholder="Email restriction notes"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="communicationRestrictions">Communication Restrictions</label>
                  <input
                    type="text"
                    id="communicationRestrictions"
                    name="communicationRestrictions"
                    value={formData.communicationRestrictions}
                    onChange={handleChange}
                    placeholder="General communication restriction notes"
                  />
                </div>
              </>
            )}
          </div>
          
          <div className="form-section">
            <div className="section-header" onClick={() => toggleSection('donation')}>
              <h3>Donation Information</h3>
              {expandedSections.donation ? <FaChevronUp /> : <FaChevronDown />}
            </div>
            
            {expandedSections.donation && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="totalDonations">Total Donations</label>
                    <input
                      type="number"
                      id="totalDonations"
                      name="totalDonations"
                      min="0"
                      step="0.01"
                      value={formData.totalDonations}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="totalPledges">Total Pledges</label>
                    <input
                      type="number"
                      id="totalPledges"
                      name="totalPledges"
                      min="0"
                      step="0.01"
                      value={formData.totalPledges}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="largestGift">Largest Gift</label>
                    <input
                      type="number"
                      id="largestGift"
                      name="largestGift"
                      min="0"
                      step="0.01"
                      value={formData.largestGift}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="largestGiftAppeal">Largest Gift Appeal</label>
                    <input
                      type="text"
                      id="largestGiftAppeal"
                      name="largestGiftAppeal"
                      value={formData.largestGiftAppeal}
                      onChange={handleChange}
                      placeholder="Appeal/Event source"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstGiftDate">First Gift Date</label>
                    <input
                      type="date"
                      id="firstGiftDate"
                      name="firstGiftDate"
                      value={formData.firstGiftDate}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="lastGiftDate">Last Gift Date</label>
                    <input
                      type="date"
                      id="lastGiftDate"
                      name="lastGiftDate"
                      value={formData.lastGiftDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="lastGiftAmount">Last Gift Amount</label>
                    <input
                      type="number"
                      id="lastGiftAmount"
                      name="lastGiftAmount"
                      min="0"
                      step="0.01"
                      value={formData.lastGiftAmount}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="lastGiftRequest">Last Gift Request</label>
                  <input
                    type="text"
                    id="lastGiftRequest"
                    name="lastGiftRequest"
                    value={formData.lastGiftRequest}
                    onChange={handleChange}
                    placeholder="Last gift request description"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="lastGiftAppeal">Last Gift Appeal</label>
                  <input
                    type="text"
                    id="lastGiftAppeal"
                    name="lastGiftAppeal"
                    value={formData.lastGiftAppeal}
                    onChange={handleChange}
                    placeholder="Appeal/Event source"
                  />
                </div>
              </>
            )}
          </div>
          
          <div className="form-section">
            <div className="section-header" onClick={() => toggleSection('management')}>
              <h3>Management Information</h3>
              {expandedSections.management ? <FaChevronUp /> : <FaChevronDown />}
            </div>
            
            {expandedSections.management && (
              <>
                <div className="form-group">
                  <label htmlFor="pmm">Prospect Move Manager (PMM)</label>
                  <input
                    type="text"
                    id="pmm"
                    name="pmm"
                    value={formData.pmm}
                    onChange={handleChange}
                    placeholder="PMM"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="smm">Stewardship Move Manager (SMM)</label>
                  <input
                    type="text"
                    id="smm"
                    name="smm"
                    value={formData.smm}
                    onChange={handleChange}
                    placeholder="SMM"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="vmm">Volunteer Move Manager (VMM)</label>
                  <input
                    type="text"
                    id="vmm"
                    name="vmm"
                    value={formData.vmm}
                    onChange={handleChange}
                    placeholder="VMM"
                  />
                </div>
              </>
            )}
          </div>
          
          <div className="form-section">
            <div className="section-header" onClick={() => toggleSection('status')}>
              <h3>Status Flags</h3>
              {expandedSections.status ? <FaChevronUp /> : <FaChevronDown />}
            </div>
            
            {expandedSections.status && (
              <div className="checkbox-group">
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="excluded"
                    name="excluded"
                    checked={formData.excluded}
                    onChange={handleChange}
                  />
                  <label htmlFor="excluded">Excluded</label>
                </div>
                
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="deceased"
                    name="deceased"
                    checked={formData.deceased}
                    onChange={handleChange}
                  />
                  <label htmlFor="deceased">Deceased</label>
                </div>
              </div>
            )}
          </div>
          
          <div className="form-section">
            <div className="section-header" onClick={() => toggleSection('subscription')}>
              <h3>Subscription Preferences</h3>
              {expandedSections.subscription ? <FaChevronUp /> : <FaChevronDown />}
            </div>
            
            {expandedSections.subscription && (
              <>
                <div className="form-group">
                  <label htmlFor="subscriptionEventsInPerson">In-Person Events Subscription</label>
                  <select
                    id="subscriptionEventsInPerson"
                    name="subscriptionEventsInPerson"
                    value={formData.subscriptionEventsInPerson}
                    onChange={handleChange}
                  >
                    <option value="">Select Preference...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Unspecified">Unspecified</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="subscriptionEventsMagazine">Magazine Subscription</label>
                  <select
                    id="subscriptionEventsMagazine"
                    name="subscriptionEventsMagazine"
                    value={formData.subscriptionEventsMagazine}
                    onChange={handleChange}
                  >
                    <option value="">Select Preference...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Unspecified">Unspecified</option>
                  </select>
                </div>
              </>
            )}
          </div>
          
          <div className="donors-modal-actions">
            <button 
              type="button" 
              className="donors-cancel-button" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="donors-save-button" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="spinner" /> Saving...
                </>
              ) : (
                <>
                  <FaSave /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

EditDonorModal.propTypes = {
  donor: PropTypes.shape({
    id: PropTypes.string.isRequired,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    nickName: PropTypes.string,
    organizationName: PropTypes.string,
    addressLine1: PropTypes.string,
    addressLine2: PropTypes.string,
    city: PropTypes.string,
    contactPhoneType: PropTypes.string,
    phoneRestrictions: PropTypes.string,
    emailRestrictions: PropTypes.string,
    communicationRestrictions: PropTypes.string,
    communicationPreference: PropTypes.string,
    totalDonations: PropTypes.number,
    totalPledges: PropTypes.number,
    largestGift: PropTypes.number,
    largestGiftAppeal: PropTypes.string,
    firstGiftDate: PropTypes.string,
    lastGiftDate: PropTypes.string,
    lastGiftAmount: PropTypes.number,
    lastGiftRequest: PropTypes.string,
    lastGiftAppeal: PropTypes.string,
    pmm: PropTypes.string,
    smm: PropTypes.string,
    vmm: PropTypes.string,
    excluded: PropTypes.bool,
    deceased: PropTypes.bool,
    subscriptionEventsInPerson: PropTypes.string,
    subscriptionEventsMagazine: PropTypes.string
  }),
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired
};

export default EditDonorModal; 