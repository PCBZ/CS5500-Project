import React, { useState } from 'react';
import { createEvent } from '../services/eventService';

function CreateNewEvent() {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    date: '',
    address: '',
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

  // Update state on input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit the form data to the server via the createEvent service
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // This calls the createEvent function defined in eventService.js
      const result = await createEvent(formData);
      setMessage(result.message || 'Event created successfully!');
      // Optionally, you can clear the form here
      // setFormData({ ...initialFormData });
    } catch (err) {
      setError('Error creating event: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset the form fields
  const handleCancel = () => {
    setFormData({
      name: '',
      type: '',
      date: '',
      address: '',
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
          placeholder="15/4/2025"
          value={formData.date}
          onChange={handleChange}
        />

        <label style={styles.label} htmlFor="address">Address</label>
        <input
          style={styles.input}
          id="address"
          name="address"
          type="text"
          placeholder="Vancouver"
          value={formData.address}
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
          placeholder="15/4/2025"
          value={formData.startDate}
          onChange={handleChange}
        />

        <label style={styles.label} htmlFor="endDate">End Date</label>
        <input
          style={styles.input}
          id="endDate"
          name="endDate"
          type="text"
          placeholder="23/4/2025"
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
          <button type="submit" style={{ ...styles.button, ...styles.submitButton }} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
      {message && <p style={{ color: 'green', marginTop: '1rem' }}>{message}</p>}
    </div>
  );
}

// Inline styles for simplicity (adjust or replace with your own CSS as needed)
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
