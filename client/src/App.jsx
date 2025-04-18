import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';

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

// 根据环境选择路由类型
const Router = process.env.NODE_ENV === 'production' ? HashRouter : BrowserRouter;

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <div className="app-content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/events/create" element={<ProtectedRoute><CreateNewEvent /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><EventManagement /></ProtectedRoute>} />
            <Route path="/donors" element={<ProtectedRoute><Donors /></ProtectedRoute>} />
            <Route path="/all-donors" element={<ProtectedRoute><AllDonors /></ProtectedRoute>} />
            <Route path="/donors/add" element={<ProtectedRoute><AddDonor /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
