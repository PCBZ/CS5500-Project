import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  return (
    <nav className="navbar" data-testid="navbar">
      <div className="navbar-brand">
        <span className="brand-text">BC Cancer Foundation</span>
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
        
        <Link 
          to="/all-donors" 
          className={`nav-item ${isActive('/all-donors') ? 'active' : ''}`}
        >
          All Donors
        </Link>
      </div>
    </nav>
  );
};

export default Navbar; 