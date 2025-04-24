import React, { useEffect, useState } from 'react';
import { getCurrentUser, logout } from '../services/authService';
import { getDonorListsSummary } from '../services/donorListService';
import { getEvents } from '../services/eventService';
import { FaCalendarAlt, FaCheckCircle, FaClock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeEvents: 0,
    reviewedDonors: 0,
    pendingReview: 0
  });
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  // Add component mount state reference
  const isMountedRef = React.useRef(true);
  // Use useNavigate hook
  const navigate = useNavigate();

  // Define fetchDashboardData function at component level
  const fetchDashboardData = async () => {
    try {
      if (isMountedRef.current) setLoading(true);
      setError(null);
      
      // Fetch donor statistics
      const summary = await getDonorListsSummary();
      
      // Fetch active events
      const eventsResult = await getEvents({ status: 'Ready', limit: 10 });
      const activeEvents = eventsResult.data || [];
      
      // Check if component is still mounted before setting state
      if (isMountedRef.current) {
        setEvents(activeEvents.slice(0, 3)); // Only show the first three events
        
        setStats({
          activeEvents: eventsResult.total_count || activeEvents.length,
          reviewedDonors: summary.total_reviewed || 0,
          pendingReview: summary.total_pending || 0
        });
        
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      if (isMountedRef.current) {
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Initialize user data when component mounts
    const userData = getCurrentUser();
    if (userData && isMountedRef.current) {
      setUser(userData);
    }

    // Call fetchDashboardData function to get data
    fetchDashboardData();

    // Cleanup function, executed when component unmounts
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Date not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  // Handle view all events
  const handleViewAllEvents = () => {
    navigate('/events');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={fetchDashboardData} className="retry-button">
          Retry
        </button>
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
              <div className="stat-number">{stats.activeEvents}</div>
            </div>
            <div className="stat-icon">
              <FaCalendarAlt />
            </div>
          </div>

          <div className="stat-card donors-reviewed">
            <div className="stat-card-content">
              <div className="stat-title">Donors Reviewed</div>
              <div className="stat-number">{stats.reviewedDonors}</div>
            </div>
            <div className="stat-icon">
              <FaCheckCircle />
            </div>
          </div>

          <div className="stat-card pending-review">
            <div className="stat-card-content">
              <div className="stat-title">Pending Review</div>
              <div className="stat-number">{stats.pendingReview}</div>
            </div>
            <div className="stat-icon">
              <FaClock />
            </div>
          </div>
        </div>

        <div className="recent-activity">
          <h2>Recent Events</h2>
          <div className="activity-list">
            {events.length > 0 ? (
              events.map(event => (
                <div className="activity-item" key={event.id}>
                  <div className="activity-icon">
                    <FaCalendarAlt />
                  </div>
                  <div className="activity-details">
                    <div className="activity-title">{event.name}</div>
                    <div className="activity-meta">
                      {formatDate(event.date)} | {event.location || 'Location not set'}
                    </div>
                  </div>
                  <div className="activity-status">Active</div>
                </div>
              ))
            ) : (
              <div className="no-events-message">
                No active events found
              </div>
            )}
            
            {events.length > 0 && (
              <a href="/events" className="view-all-link" onClick={(e) => {
                e.preventDefault();
                handleViewAllEvents();
              }}>
                View all events
              </a>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;