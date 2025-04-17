import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import App from './App';

const TestApp = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<TestApp />);
  });

  it('redirects to login page by default', () => {
    render(<TestApp />);
    expect(window.location.pathname).toBe('/login');
  });

  it('renders Navbar component', () => {
    render(<TestApp />);
    const navbar = screen.getByTestId('navbar');
    expect(navbar).toBeInTheDocument();
  });
}); 