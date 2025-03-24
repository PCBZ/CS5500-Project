import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';

// Component imports
import Login from './components/auth/Login.jsx';
import Register from './components/auth/Register.jsx';
import Dashboard from './components/Dashboard.jsx';
import EventManagement from './components/events/EventManagement.jsx';
import Donors from './components/donors/Donors.jsx';
import Navbar from './components/common/Navbar.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <div className="app-content">
          <Switch>
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <ProtectedRoute path="/dashboard" component={Dashboard} />
            <Route path="/events" component={EventManagement} />
            <ProtectedRoute path="/donors" component={Donors} />
            <Redirect from="/" to="/login" />
          </Switch>
        </div>
      </div>
    </Router>
  );
}

export default App; 