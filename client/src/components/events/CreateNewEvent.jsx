import React, { useState } from 'react';
import './EventManagement.css';
import { createEvent } from '../../services/eventAPI';
import authService from '../../services/authService.js';

function CreateNewEvent() {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    date: '', // expecting format "YYYY-MM-DD"
    location: '',
    capacity: '',
    focus: '',
    ticketPrice: '',
    startDate: '',
    endDate: '',
    eventStage: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Helper function to validate date string
  const isValidDate = (dateString) => {
    const d = new Date(dateString);
    return d instanceof Date && !isNaN(d);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Debug log
    console.log("Submitting form with data:", formData);

    // Check required fields
    if (!formData.name || !formData.type || !formData.date || !formData.location) {
      setError('Name, type, date, and location are required');
      setLoading(false);
      return;
    }

    // Validate date field(s)
    if (!isValidDate(formData.date)) {
      setError('Please enter a valid date in YYYY-MM-DD format for the event date');
      setLoading(false);
      return;
    }
    // Optionally validate startDate and endDate if provided
    if (formData.startDate && !isValidDate(formData.startDate)) {
      setError('Please enter a valid date in YYYY-MM-DD format for the start date');
      setLoading(false);
      return;
    }
    if (formData.endDate && !isValidDate(formData.endDate)) {
      setError('Please enter a valid date in YYYY-MM-DD format for the end date');
      setLoading(false);
      return;
    }

    try {
      // Convert date fields to Date objects before sending, if needed
      const payload = {
        ...formData,
        date: new Date(formData.date),
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        endDate: formData.endDate ? new Date(formData.endDate) : null,
      };

      const result = await createEvent(payload);
      setMessage(result.message || 'Event created successfully!');
      // Optionally, reset form after submission:
      // setFormData({ name: '', type: '', date: '', location: '', capacity: '', focus: '', ticketPrice: '', startDate: '', endDate: '', eventStage: '' });
    } catch (err) {
      console.error("Error in createEvent:", err);
      setError('Error creating event: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel to reset form fields
  const handleCancel = () => {
    console.log("Cancel button clicked");
    setFormData({
      name: '',
      type: '',
      date: '',
      location: '',
      capacity: '',
      focus: '',
      ticketPrice: '',
      startDate: '',
      endDate: '',
      eventStage: '',
    });
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>BC Cancer Foundation</h1>
      <h2 style={styles.subtitle}>Create New Event</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label} htmlFor="name">Name</label>
        <input
          style={styles.input}
          id="name"
          name="name"
          type="text"
          placeholder="Spring Gala 2025"
          value={formData.name}
          onChange={handleChange}
        />

        <label style={styles.label} htmlFor="type">Type</label>
        <input
          style={styles.input}
          id="type"
          name="type"
          type="text"
          placeholder="Major Donor Event"
          value={formData.type}
          onChange={handleChange}
        />

        <label style={styles.label} htmlFor="date">Date</label>
        <input
          style={styles.input}
          id="date"
          name="date"
          type="text"
          placeholder="YYYY-MM-DD"
          value={formData.date}
          onChange={handleChange}
        />

        <label style={styles.label} htmlFor="location">Location</label>
        <input
          style={styles.input}
          id="location"
          name="location"
          type="text"
          placeholder="Vancouver"
          value={formData.location}
          onChange={handleChange}
        />

        <label style={styles.label} htmlFor="capacity">Capacity</label>
        <input
          style={styles.input}
          id="capacity"
          name="capacity"
          type="number"
          placeholder="200"
          value={formData.capacity}
          onChange={handleChange}
        />

        <label style={styles.label} htmlFor="focus">Focus</label>
        <input
          style={styles.input}
          id="focus"
          name="focus"
          type="text"
          placeholder="Cancer Research"
          value={formData.focus}
          onChange={handleChange}
        />

        <label style={styles.label} htmlFor="ticketPrice">Ticket Price</label>
        <input
          style={styles.input}
          id="ticketPrice"
          name="ticketPrice"
          type="number"
          placeholder="2500"
          value={formData.ticketPrice}
          onChange={handleChange}
        />

        <label style={styles.label} htmlFor="startDate">Start Date</label>
        <input
          style={styles.input}
          id="startDate"
          name="startDate"
          type="text"
          placeholder="YYYY-MM-DD (optional)"
          value={formData.startDate}
          onChange={handleChange}
        />

        <label style={styles.label} htmlFor="endDate">End Date</label>
        <input
          style={styles.input}
          id="endDate"
          name="endDate"
          type="text"
          placeholder="YYYY-MM-DD (optional)"
          value={formData.endDate}
          onChange={handleChange}
        />

        <label style={styles.label} htmlFor="eventStage">Event Stage</label>
        <input
          style={styles.input}
          id="eventStage"
          name="eventStage"
          type="text"
          placeholder="Planning"
          value={formData.eventStage}
          onChange={handleChange}
        />

        <div style={styles.buttonContainer}>
          <button
            type="button"
            onClick={handleCancel}
            style={{ ...styles.button, ...styles.cancelButton }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{ ...styles.button, ...styles.submitButton }}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
      {message && <p style={{ color: 'green', marginTop: '1rem' }}>{message}</p>}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    fontFamily: 'sans-serif',
    padding: '2rem',
    color: '#333',
  },
  title: {
    color: '#6C63FF',
    marginBottom: '0.5rem',
  },
  subtitle: {
    marginBottom: '2rem',
    fontWeight: 'normal',
    color: '#555',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '0.25rem',
    marginTop: '1rem',
    fontWeight: 'bold',
  },
  input: {
    padding: '0.5rem',
    fontSize: '1rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '2rem',
    gap: '1rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#6C63FF',
    color: '#fff',
  },
};

export default CreateNewEvent;
