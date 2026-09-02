# BC Cancer Foundation Donor Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.2.0-blue)](https://reactjs.org/)
[![Build Status](https://github.com/PCBZ/CS5500-Project/workflows/CI/badge.svg)](https://github.com/PCBZ/CS5500-Project/actions/workflows/ci.yml)
[![GitHub issues](https://img.shields.io/github/issues/PCBZ/CS5500-Project)](https://github.com/PCBZ/CS5500-Project/issues)
[![GitHub forks](https://img.shields.io/github/forks/PCBZ/CS5500-Project)](https://github.com/PCBZ/CS5500-Project/network)
[![GitHub stars](https://img.shields.io/github/stars/PCBZ/CS5500-Project)](https://github.com/PCBZ/CS5500-Project/stargazers)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/PCBZ/CS5500-Project/releases)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/PCBZ/CS5500-Project/pulls)

A comprehensive donor management system designed specifically for BC Cancer Foundation to streamline event management, donor tracking, and relationship management for fundraising activities.

## Features

### 🎯 Core Functionality
- **Event Management**
  - Create and manage fundraising events
  - Track event status (Planning, List Generation, Review, Ready, Complete)
  - Set comprehensive event details (date, location, capacity, focus area)
  - Export donor lists in multiple formats
  - Real-time event status updates and timeline management

- **Donor Management**
  - Comprehensive donor database with detailed profiles
  - Track donation history and giving patterns
  - Manage donor status for specific events (Approved, Excluded, Pending)
  - Advanced search and filtering capabilities
  - Export donor data for external use

### 📊 Analytics & Reporting
- Real-time dashboard with key metrics
- Donor list statistics and approval rates
- Event performance tracking
- Progress monitoring and reporting tools

### 🔐 Security & Authentication
- Secure JWT-based authentication system
- Role-based access control
- Protected API endpoints
- User session management

## Tech Stack

### Frontend
- **React.js** (v18.2.0) - Modern UI library with hooks and functional components
- **Material UI (MUI)** (v5) - Component library and design system (`@mui/material`, `@mui/icons-material`)
- **React Router** (v6) - Client-side routing and navigation
- **Axios** - HTTP client for API requests
- **React Toastify** - Toast notifications

### Backend
- **Node.js** (v18+) - JavaScript runtime environment
- **Express.js** - Web application framework
- **Prisma ORM** (v6) - Type-safe database client and migrations
- **PostgreSQL** - Relational database (hosted on Neon in production)
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing and security

### Testing & Quality
- **Jest** - JavaScript testing framework
- **React Testing Library** - Testing utilities for React components
- **ESLint** - Code linting and quality enforcement
- **Prettier** - Code formatting and style consistency

### DevOps & Deployment
- **Docker** - Containerization for consistent deployments (see [Dockerfile](Dockerfile))
- **GitHub Actions** - CI/CD pipeline automation
- **Render** - Cloud deployment platform

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (or a hosted Postgres instance such as Neon)
- npm (v9 or higher)
- Docker (optional, for containerized deployment)

## Installation

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone git@github.com:PCBZ/CS5500-Project.git
   cd CS5500-Project
   ```

2. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables:**
   
   **Backend (.env in Server directory):**
   ```bash
   cd Server
   cp .env.example .env
   ```
   Configure the following variables:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/donor_management"
   JWT_SECRET="your_secure_jwt_secret_key"
   PORT=5001
   NODE_ENV=development
   ```

   **Frontend (.env in client directory):**
   ```bash
   cd ../client
   ```
   Create a `.env` file with:
   ```env
   REACT_APP_API_URL=http://localhost:5001
   ```

4. **Set up the database:**
   ```bash
   cd ../Server
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Start the development servers:**
   ```bash
   # Option 1: Start both frontend and backend together (recommended)
   npm start

   # Option 2: Start separately
   # Backend (from Server directory)
   cd Server && npm run dev

   # Frontend (from client directory, in a new terminal)
   cd client && npm start
   ```

6. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

### Alternative Installation Methods

#### Using Docker
Build and run the container image (frontend on :3001, backend on :5001):
```bash
docker build -t cs5500-project .
docker run -p 3001:3001 -p 5001:5001 --env-file Server/.env cs5500-project
```

#### Production Build
```bash
npm run start:prod
```

## Project Structure

```
.
├── Server/                 # Backend server
│   ├── src/               # Source code
│   │   ├── routes/        # API route handlers
│   │   ├── middleware/    # Custom middleware
│   │   ├── lib/           # Prisma client and utilities
│   │   ├── app.js         # Express app configuration
│   │   └── index.js       # Application entry point
│   ├── prisma/            # Prisma configuration
│   │   ├── migrations/    # Database migrations
│   │   └── schema.prisma  # Database schema
│   ├── test/             # Test files
│   ├── docs/             # Generated API documentation
│   └── package.json      # Backend dependencies
├── client/                # Frontend application
│   ├── src/              # Source code
│   │   ├── components/   # React components
│   │   │   ├── auth/     # Authentication components
│   │   │   ├── common/   # Shared components
│   │   │   ├── donors/   # Donor-related components
│   │   │   └── events/   # Event-related components
│   │   ├── services/     # API service functions
│   │   ├── api/          # API client setup
│   │   ├── config.js     # App configuration
│   │   └── App.jsx       # Application entry
│   ├── public/           # Static files
│   └── package.json      # Frontend dependencies
└── scripts/              # Utility scripts
    └── uploadTestData.js # Test data upload script
```

## Testing

### Running Tests

#### Backend Tests
```bash
cd Server
npm test
```

#### Frontend Tests
```bash
cd client
npm test
```

> **Note:** There is no root-level test runner. Run the backend and frontend
> test suites separately from their respective directories as shown above.

### Test Coverage
- **Backend**: Unit tests for API endpoints, authentication, and database operations
- **Frontend**: Component tests, integration tests, and user interaction tests
- **E2E Testing**: Automated testing of complete user workflows

### Continuous Integration
All tests are automatically run on:
- Every push to main branch
- All pull requests
- Manual workflow dispatch

View test results: [GitHub Actions](https://github.com/PCBZ/CS5500-Project/actions)

## Deployment

### Docker Deployment

1. Build and run using Docker:
```bash
docker build -t cs5500-project .
docker run -p 3001:3001 -p 5001:5001 --env-file Server/.env cs5500-project
```

2. Access the application:
- Frontend: http://localhost:3001
- Backend API: http://localhost:5001

### Environment Variables

Configure the application using environment variables (backend `.env` in the `Server` directory):

- `DATABASE_URL`: PostgreSQL connection string (e.g. `postgresql://user:password@host:5432/db`)
- `JWT_SECRET`: JWT secret key
- `PORT`: Backend service port (default: 5001)
- `NODE_ENV`: Runtime environment (default: development)
- `REACT_APP_API_URL`: Backend API URL used by the frontend (e.g. `http://localhost:5001`)

## Contributing

We welcome contributions to the BC Cancer Foundation Donor Management System! Please read our contribution guidelines below.

### How to Contribute

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub or use GitHub CLI
   gh repo fork PCBZ/CS5500-Project
   ```

2. **Create your feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow the existing code style and conventions
   - Add tests for new functionality
   - Update documentation as needed

4. **Run tests and linting**
   ```bash
   # Run all tests
   npm test
   
   # Run linting
   cd client && npm run lint
   cd ../Server && npm run lint
   ```

5. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```

6. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request**
   - Use the GitHub web interface or GitHub CLI
   - Provide a clear description of your changes
   - Reference any related issues

### Development Guidelines

- **Code Style**: Follow ESLint and Prettier configurations
- **Testing**: Maintain or improve test coverage
- **Documentation**: Update README and inline documentation
- **Commit Messages**: Use clear, descriptive commit messages
- **Pull Requests**: Keep PRs focused and atomic

### Reporting Issues

If you encounter bugs or have feature requests:
1. Check existing [issues](https://github.com/PCBZ/CS5500-Project/issues)
2. Create a new issue with detailed description
3. Include steps to reproduce (for bugs)
4. Add relevant labels and milestones

### Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the maintainers.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### License Summary
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ❌ Liability
- ❌ Warranty

## Contact & Support

### Maintainers
- **Project Team**: PCBZ Organization
- **Repository**: [PCBZ/CS5500-Project](https://github.com/PCBZ/CS5500-Project)

### Getting Help
- 📋 **Issues**: [GitHub Issues](https://github.com/PCBZ/CS5500-Project/issues)
- 🔀 **Pull Requests**: [GitHub PRs](https://github.com/PCBZ/CS5500-Project/pulls)
- 📖 **Documentation**: Check the [docs](Server/docs/) directory for API documentation

### Project Links
- 🏠 **Homepage**: [GitHub Repository](https://github.com/PCBZ/CS5500-Project)
- 📈 **Actions**: [CI/CD Pipeline](https://github.com/PCBZ/CS5500-Project/actions)
- 🐛 **Bug Reports**: [New Issue](https://github.com/PCBZ/CS5500-Project/issues/new)

---

<div align="center">
  <p>Built with ❤️ for BC Cancer Foundation</p>
  <p>Made by <a href="https://github.com/PCBZ">PCBZ Team</a></p>
</div>
