import React, { useEffect, useState } from 'react';
import { getCurrentUser, logout } from '../services/authService';
import { FaCalendarAlt, FaCheckCircle, FaClock } from 'react-icons/fa';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current logged-in user
    const userData = getCurrentUser();
    if (userData) {
      setUser(userData);
    }
    setLoading(false);
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>BC Cancer Foundation</h1>
        {user && (
          <div className="user-info">
            <span>Welcome, {user.name}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        )}
      </header>

      <main className="dashboard-content">
        <div className="stats-container">
          <div className="stat-card active-events">
            <div className="stat-card-content">
              <div className="stat-title">Active Events</div>
              <div className="stat-number">5</div>
            </div>
            <div className="stat-icon">
              <FaCalendarAlt />
            </div>
          </div>

          <div className="stat-card donors-reviewed">
            <div className="stat-card-content">
              <div className="stat-title">Donors Reviewed</div>
              <div className="stat-number">143</div>
            </div>
            <div className="stat-icon">
              <FaCheckCircle />
            </div>
          </div>

          <div className="stat-card pending-review">
            <div className="stat-card-content">
              <div className="stat-title">Pending Review</div>
              <div className="stat-number">67</div>
            </div>
            <div className="stat-icon">
              <FaClock />
            </div>
          </div>
        </div>

        <div className="recent-activity">
          <h2>Recent Activities</h2>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">
                <FaCalendarAlt />
              </div>
              <div className="activity-details">
                <div className="activity-title">Spring Charity Gala</div>
                <div className="activity-meta">March 15, 2025 | Vancouver Convention Center</div>
              </div>
              <div className="activity-status">Active</div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">
                <FaCalendarAlt />
              </div>
              <div className="activity-details">
                <div className="activity-title">Research Symposium</div>
                <div className="activity-meta">April 22, 2025 | BC Cancer Research Center</div>
              </div>
              <div className="activity-status">Upcoming</div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">
                <FaCalendarAlt />
              </div>
              <div className="activity-details">
                <div className="activity-title">Donor Appreciation Day</div>
                <div className="activity-meta">May 10, 2025 | Stanley Park</div>
              </div>
              <div className="activity-status">Upcoming</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 