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
- **TypeScript** - Type-safe JavaScript for better development experience
- **Material-UI** (@mui/material) - React component library for consistent design
- **React Router** (v6) - Client-side routing and navigation
- **React Icons** - Comprehensive icon library
- **Axios** - HTTP client for API communication

### Backend
- **Node.js** (v18+) - JavaScript runtime environment
- **Express.js** - Web application framework
- **Prisma ORM** - Type-safe database client and migrations
- **MySQL** (v8.0+) - Relational database management system
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing and security

### Testing & Quality
- **Jest** - JavaScript testing framework
- **React Testing Library** - Testing utilities for React components
- **ESLint** - Code linting and quality enforcement
- **Prettier** - Code formatting and style consistency

### DevOps & Deployment
- **Docker** - Containerization for consistent deployments
- **GitHub Actions** - CI/CD pipeline automation
- **Render/Heroku** - Cloud deployment platforms

## Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
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
   DATABASE_URL="mysql://username:password@localhost:3306/donor_management"
   JWT_SECRET="your_secure_jwt_secret_key"
   PORT=5000
   NODE_ENV=development
   ```

   **Frontend (.env in client directory):**
   ```bash
   cd ../client
   cp .env.example .env
   ```
   Configure:
   ```env
   REACT_APP_API_URL=http://localhost:5000
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
   - Backend API: http://localhost:5000

### Alternative Installation Methods

#### Using Docker
```bash
docker-compose up -d
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

#### Run All Tests
```bash
# From root directory
npm test
```

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