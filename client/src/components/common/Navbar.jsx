import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="brand-link">BC Cancer Foundation</Link>
      </div>
      
      <div className="navbar-menu">
        <Link 
          to="/dashboard" 
          className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
        >
          Dashboard
        </Link>
        
        <Link 
          to="/events" 
          className={`nav-item ${isActive('/events') ? 'active' : ''}`}
        >
          Events
        </Link>
        
        <Link 
          to="/donors" 
          className={`nav-item ${isActive('/donors') ? 'active' : ''}`}
        >
          Donors
        </Link>
      </div>
    </nav>
  );
};

export default Navbar; 