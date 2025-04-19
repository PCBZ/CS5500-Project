import React, { useState, useEffect, useCallback } from 'react';
import { FaSpinner } from 'react-icons/fa';
import './RecommendedDonors.css';

const RecommendedDonors = ({ 
  eventId, 
  onDonorSelect, 
  selectedDonors,
  currentEventDonors 
}) => {
  const [recommendedDonors, setRecommendedDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendedDonors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `${window.REACT_APP_API_URL || 'http://localhost:3000'}/api/events/${eventId}/recommended-donors`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // 过滤掉已经在活动中的捐赠者
      const filteredDonors = data.recommendedDonors.filter(donor => 
        !currentEventDonors.some(eventDonor => eventDonor.id === donor.id)
      );
      
      setRecommendedDonors(filteredDonors);
    } catch (err) {
      console.error('Error fetching recommended donors:', err);
      setError(err.message || 'Failed to fetch recommended donors');
    } finally {
      setLoading(false);
    }
  }, [eventId, currentEventDonors]);

  useEffect(() => {
    if (eventId) {
      fetchRecommendedDonors();
    }
  }, [eventId, fetchRecommendedDonors]);

  if (!eventId) return null;

  return (
    <div className="recommended-donors-section">
      <h4>Recommended Donors</h4>
      {loading ? (
        <div className="loading-container">
          <FaSpinner className="spinner" />
          <p>Loading recommendations...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          {error}
        </div>
      ) : recommendedDonors.length === 0 ? (
        <p className="no-recommendations">No recommended donors available for this event.</p>
      ) : (
        <div className="recommended-donors-grid">
          {recommendedDonors.map(donor => (
            <div 
              key={donor.id} 
              className={`recommended-donor-item ${
                selectedDonors.some(d => d.id === donor.id) ? 'selected' : ''
              }`}
              onClick={() => onDonorSelect(donor)}
            >
              <div className="donor-info">
                <p className="donor-name">
                  {donor.firstName} {donor.lastName}
                  {donor.organizationName && (
                    <span className="organization-name">
                      ({donor.organizationName})
                    </span>
                  )}
                </p>
                <p className="donor-details">
                  <span className="donation-amount">
                    Total Donations: ${donor.totalDonations?.toLocaleString() || 0}
                  </span>
                  {donor.city && (
                    <span className="donor-city">
                      | {donor.city}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendedDonors;
