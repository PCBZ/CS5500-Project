import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { isAuthenticated } from '../../services/authService';

// Protected route component that ensures only logged-in users can access
const ProtectedRoute = ({ component: Component, ...rest }) => {
  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated() ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
              pathname: '/login',
              state: { from: props.location }
            }}
          />
        )
      }
    />
  );
};

export default ProtectedRoute; 