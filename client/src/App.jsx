import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BASE_URL } from './api/config';

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

// 根据环境选择路由
const Router = process.env.NODE_ENV === 'production' ? HashRouter : BrowserRouter;

function App() {
  return (
    <Router basename={process.env.NODE_ENV === 'production' ? '' : '/'}>
      <div className="app-container">
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute><EventManagement /></ProtectedRoute>} />
          <Route path="/events/new" element={<ProtectedRoute><CreateNewEvent /></ProtectedRoute>} />
          <Route path="/donors" element={<ProtectedRoute><Donors /></ProtectedRoute>} />
          <Route path="/donors/all" element={<ProtectedRoute><AllDonors /></ProtectedRoute>} />
          <Route path="/donors/add" element={<ProtectedRoute><AddDonor /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
