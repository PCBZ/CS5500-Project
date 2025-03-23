# BC Cancer Foundation - Donor Management Application

This is the frontend of the Donor Management System for BC Cancer Foundation, built with React.

## Overview

The BC Cancer Foundation Donor Management System is a web-based application designed to help staff manage donor lists for various fundraising events. The system allows users to review potential donors, approve or exclude them from events, and track invitations.

## Features

- **User Authentication**: Secure login and registration system
- **Dashboard**: Visual overview of active events, donor statistics, and recent activities
- **Donor Management**: Review and manage donor lists for upcoming events
- **Event Management**: Create and manage fundraising events

## Technologies Used

- React 
- React Router for navigation
- Fetch API for HTTP requests
- React Icons for UI elements
- CSS for styling

## Getting Started

### Prerequisites

- Node.js (v14 or later recommended)
- npm (v6 or later)

### Installation

1. Clone the repository:
   ```
   git clone git@github.com:J3rrrrry/CS5500-Project.git
   cd CS5500-Project/client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. The application will be available at http://localhost:3001

## Project Structure

- `/src`: Main source code directory
  - `/components`: React components
    - `/auth`: Authentication components (Login, Register)
    - `/common`: Common UI components (Navbar)
    - `/donors`: Donor management components
    - `/events`: Event management components
  - `/services`: Service layer for API communication
  - `/styles`: CSS styles
  - `App.jsx`: Main application component
  - `index.js`: Application entry point

## Available Scripts

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production
- `npm run eject`: Ejects the app from Create React App

## Backend API

The frontend communicates with a Node.js/Express backend that provides the following API endpoints:

- `/api/user`: User authentication endpoints
- `/api/events`: Event management endpoints
- `/api/donors`: Donor management endpoints

## Screenshots

- Dashboard: Overview of key metrics and recent activities
- Donor Management: Review and manage donor lists for upcoming events
- Event Management: Create and manage fundraising events

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- BC Cancer Foundation team for their guidance and feedback
- All contributors to this project 