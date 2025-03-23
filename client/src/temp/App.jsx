import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';

// Component imports
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
import EventManagement from './components/events/EventManagement';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/auth/ProtectedRoute';
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
            <ProtectedRoute path="/events" component={EventManagement} />
            <ProtectedRoute path="/donors" component={() => <h1>Donors Page</h1>} />
            <ProtectedRoute path="/reports" component={() => <h1>Reports Page</h1>} />
            <Redirect from="/" to="/login" />
          </Switch>
        </div>
      </div>
    </Router>
  );
}

export default App; 