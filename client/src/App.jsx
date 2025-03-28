import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';

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
            {/* Add a specific route for creating a new event */}
            <ProtectedRoute path="/events/create" component={CreateNewEvent} />
            {/* Ensure the /events route comes after the more specific /events/create */}
            <ProtectedRoute path="/events" component={EventManagement} />
            <ProtectedRoute path="/donors" component={Donors} />
            <ProtectedRoute path="/all-donors" component={AllDonors} />
            <Redirect from="/" to="/login" />
          </Switch>
        </div>
      </div>
    </Router>
  );
}

export default App;
