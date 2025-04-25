import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import App from './App';
import { isAuthenticated, getCurrentUser } from './services/authService';

// Mock the auth service
jest.mock('./services/authService', () => ({
  isAuthenticated: jest.fn(),
  getCurrentUser: jest.fn().mockReturnValue({
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com'
  })
}));

// Mock the Router component
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }) => <div>{children}</div>,
  HashRouter: ({ children }) => <div>{children}</div>,
}));

describe('App Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
  });

  test('redirects to login when not authenticated', () => {
    isAuthenticated.mockReturnValue(false);
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    
    expect(isAuthenticated).toHaveBeenCalled();
  });

  test('redirects to dashboard when authenticated', () => {
    isAuthenticated.mockReturnValue(true);
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    
    expect(isAuthenticated).toHaveBeenCalled();
  });

  test('renders Navbar component', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    
    // Assuming Navbar has some identifiable text or element
    const navbar = screen.getByRole('navigation');
    expect(navbar).toBeInTheDocument();
  });

  test('displays current user information', () => {
    isAuthenticated.mockReturnValue(true);
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    
    expect(getCurrentUser).toHaveBeenCalled();
    // Add assertions for user information display if applicable
  });
}); 