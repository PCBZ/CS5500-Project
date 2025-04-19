import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './services/authService';

// Component imports
import Login from './components/auth/Login.jsx';
import Register from './components/auth/Register.jsx';
import Dashboard from './components/Dashboard.jsx';
import EventManagement from './components/events/EventManagement.jsx';
import CreateNewEvent from './components/events/CreateNewEvent.jsx';
import Donors from './components/donors/Donors.jsx';
import AllDonors from './components/donors/AllDonors.jsx';
import Navbar from './components/common/Navbar.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import AddDonor from './components/donors/AddDonor';
import './App.css';

// Use HashRouter in production (GitHub Pages)
const Router = process.env.NODE_ENV === 'production' ? HashRouter : BrowserRouter;
const BASE_PATH = process.env.NODE_ENV === 'production' ? '/CS5500-Project' : '';

function App() {
  return (
    <Router basename={BASE_PATH}>
      <div className="app-container">
        <Navbar />
        <div className="app-content">
          <Routes>
            <Route 
              path="/" 
              element={
                isAuthenticated() ? 
                <Navigate to="/dashboard" replace /> : 
                <Navigate to="/login" replace />
              } 
            />
            <Route 
              path="/login" 
              element={
                isAuthenticated() ? 
                <Navigate to="/dashboard" replace /> : 
                <Login />
              } 
            />
            <Route 
              path="/register" 
              element={
                isAuthenticated() ? 
                <Navigate to="/dashboard" replace /> : 
                <Register />
              } 
            />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><EventManagement /></ProtectedRoute>} />
            <Route path="/events/new" element={<ProtectedRoute><CreateNewEvent /></ProtectedRoute>} />
            <Route path="/donors" element={<ProtectedRoute><Donors /></ProtectedRoute>} />
            <Route path="/all-donors" element={<ProtectedRoute><AllDonors /></ProtectedRoute>} />
            <Route path="/donors/add" element={<ProtectedRoute><AddDonor /></ProtectedRoute>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
