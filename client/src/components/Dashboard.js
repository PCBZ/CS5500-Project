import React, { useEffect, useState } from 'react';
import { getCurrentUser, logout } from '../services/authService';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get current logged-in user
    const userData = getCurrentUser();
    if (userData) {
      setUser(userData);
    }
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  if (!user) {
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
        <h1>Donor Management System</h1>
        <div className="user-info">
          <span>Welcome, {user.name}</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome to the Donor Management System</h2>
          <p>You have successfully logged in!</p>
          <div className="user-details">
            <p><strong>Username:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role.toUpperCase()}</p>
          </div>
        </div>
        
        <div className="dashboard-message">
          <p>
            This is a simple dashboard demonstration page. In an actual application, this would display function menus and data statistics related to user permissions.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 