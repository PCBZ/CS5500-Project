import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { createDonor } from '../../services/donorService';
import './AddDonor.css';

const AddDonor = () => {
  const history = useHistory();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    type: 'individual',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await createDonor(formData);
      setSuccess('Donor added successfully!');
      setTimeout(() => {
        history.push('/donors');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to add donor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-donor-container">
      <div className="add-donor-header">
        <h1>Add New Donor</h1>
        <button 
          className="add-donor-close-button"
          onClick={() => history.push('/donors')}
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="add-donor-form">
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="address">Address</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="individual">Individual</option>
            <option value="organization">Organization</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="add-donor-button-container">
          <button 
            type="submit" 
            className="add-donor-submit-button"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Donor'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddDonor; 