# BC Cancer Fundation Donor Management System

A comprehensive event management system for handling donor events, donor management, and event-donor relationships.

## Features

- Event Management
  - Create and manage events
  - Track event status (Planning, List Generation, Review, Ready, Complete)
  - Set event details (date, location, capacity, etc.)
  - Export donor lists
  - Real-time event status updates

- Donor Management
  - Add and manage donors
  - Track donor information and history
  - Manage donor status for events
  - Export donor data
  - Advanced search and filtering

## Tech Stack

- Frontend:
  - React.js
  - Redux for state management
  - React Router for navigation

- Backend:
  - Node.js with Express
  - MySQL for database
  - JWT for authentication
  - Jest for testing

- DevOps:
  - Docker for containerization
  - GitHub Actions for CI/CD
  - ESLint for code formatting

## Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm (v9 or higher)
- Docker (optional, for containerized deployment)

## Installation

1. Clone the repository:
```bash
git clone git@github.com:PCBZ/CS5500-Project.git
cd CS5500-Project
```

2. Install dependencies:
```bash
# Install backend dependencies
cd Server
npm install

# Install frontend dependencies
cd ../client
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both Server and client directories
   - Update the variables with your configuration

4. Start the development servers:
```bash
# Start backend server (from Server directory)
npm run dev

# Start frontend server (from client directory)
npm start
```

## Project Structure

```
.
├── Server/                 # Backend server
│   ├── src/               # Source code
│   │   ├── routes/        # API route handlers
│   │   ├── middleware/    # Custom middleware
│   │   ├── lib/          # Prisma ORM and utilities
│   │   └── index.js      # Application entry point
│   ├── prisma/           # Prisma configuration
│   │   ├── migrations/   # Database migrations
│   │   └── schema.prisma # Database schema
│   ├── test/            # Test files
│   ├── docs/            # API documentation
│   └── package.json     # Backend dependencies
├── client/               # Frontend application
│   ├── src/             # Source code
│   │   ├── components/  # React components
│   │   │   ├── common/  # Shared components
│   │   │   ├── donors/  # Donor-related components
│   │   │   ├── events/  # Event-related components
│   │   │   └── lists/   # List-related components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service functions
│   │   └── App.js       # Application entry
│   ├── public/          # Static files
│   └── package.json     # Frontend dependencies
└── scripts/             # Utility scripts
    └── uploadTestData.js # Test data upload script
```

## Testing

### Backend Tests
```bash
cd Server
npm test
```

### Frontend Tests
```bash
cd client
npm test
```

## Deployment

### Docker Deployment

1. Build and run using Docker:
```bash
docker-compose up -d
```

2. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Environment Variables

Configure the application using environment variables:

- `PORT`: Frontend service port (default: 3000)
- `API_PORT`: Backend service port (default: 5000)
- `NODE_ENV`: Runtime environment (default: production)
- `MYSQL_HOST`: MySQL host (default: localhost)
- `MYSQL_USER`: MySQL username
- `MYSQL_PASSWORD`: MySQL password
- `MYSQL_DATABASE`: MySQL database name
- `JWT_SECRET`: JWT secret key
- `LOG_LEVEL`: Logging level (default: info)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.