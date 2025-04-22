# BC Cancer Donor Management System - Server Side

This is the backend server component of the BC Cancer Donor Management System, built with Node.js, Express, and Prisma ORM.

## Prerequisites

- Node.js >= 16.0.0
- MySQL >= 8.0
- npm >= 8.0.0

## Installation

1. Clone the repository and navigate to the server directory:
```bash
git clone git@github.com:PCBZ/CS5500-Project.git
cd Server
```

2. Install dependencies:
```bash
npm install
```

3. Environment Setup:
   - Copy the environment template file:
   ```bash
   cp .env.example .env
   ```
   - Configure the following variables in `.env`:
   ```env
   # Database Configuration
   DATABASE_URL="mysql://username:password@localhost:3306/your_database"
   
   # JWT Configuration
   JWT_SECRET="your_jwt_secret_key"
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

4. Database Migration:
```bash
npx prisma migrate dev
```

## Running the Server

### Development Environment
```bash
npm run dev
```

### Production Environment
```bash
npm start
```

## API Documentation

Generate API documentation:
```bash
npm run docs
```
The generated documentation will be saved in the `docs` directory and can be viewed by opening `docs/index.html` in a browser.

## Testing

Run tests:
```bash
npm test
```

## Project Structure

```
Server/
├── src/                # Source code
│   ├── routes/        # Route handlers
│   ├── middleware/    # Middleware
│   ├── lib/          # Prisma ORM
│   └── index.js      # Application entry
├── test/            # Test files
├── docs/            # API documentation
└── package.json     # Project configuration
```

## API Endpoints

### Authentication API

- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login
- POST `/api/auth/logout` - User logout
- GET `/api/auth/me` - Get current user details

### Events API

- GET `/api/events` - Get all events with pagination
- GET `/api/events/:id` - Get event by ID
- POST `/api/events` - Create new event
- PUT `/api/events/:id` - Update event
- DELETE `/api/events/:id` - Delete event (soft delete)
- PUT `/api/events/:id/status` - Update event status
- GET `/api/events/types` - Get all event types
- GET `/api/events/locations` - Get all event locations

### Event Donors API

- GET `/api/events/:id/donors` - Get event donors
- POST `/api/events/:id/donors` - Add donor to event
- DELETE `/api/events/:id/donors/:donorId` - Remove donor from event
- PATCH `/api/events/:id/donors/:donorId` - Update donor information
- PATCH `/api/events/:id/donors/:donorId/status` - Update donor status

### Donors API

- GET `/api/donors` - Get all donors with pagination, filtering, and sorting
- GET `/api/donors/:id` - Get donor by ID
- POST `/api/donors` - Create new donor
- PUT `/api/donors/:id` - Update donor information
- DELETE `/api/donors/:id` - Delete donor
- DELETE `/api/donors/batch` - Batch delete donors
- POST `/api/donors/import` - Import donors from CSV/Excel
- GET `/api/donors/export` - Export donors to CSV

### Donor Lists API

- GET `/api/lists` - Get all donor lists
- GET `/api/lists/:id` - Get list details
- POST `/api/lists` - Create new list
- PUT `/api/lists/:id` - Update list
- DELETE `/api/lists/:id` - Delete list
- PUT `/api/lists/:id/status` - Update list review status
- GET `/api/lists/stats/summary` - Get summary statistics for all lists
- GET `/api/donor-lists/:id/donors` - Get donors from a specific list

### Progress API

- GET `/api/progress/:id` - Get operation progress by ID

## Error Handling

The server uses standard HTTP status codes:

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

Error responses include:
```json
{
  "error": true,
  "message": "Error message",
  "status": 400
}
```

## Security Features

- Password encryption using bcrypt
- JWT-based authentication
- Request parameter validation
- Error logging
- CORS protection
- Rate limiting
- Input sanitization

## Development Guidelines

1. Code Style
   - Use ES6+ syntax
   - Use async/await for asynchronous operations
   - Follow RESTful API design principles

2. Before Committing:
   - Run tests `npm test`
   - Run linter `npm run lint`
   - Update documentation `npm run docs`
   - Ensure no linting errors

## Deployment

1. Prepare Server Environment:
```bash
# Install Node.js and MySQL
```

2. Database Setup:
```bash
# Create database and user
mysql -u root -p
CREATE DATABASE your_database;
CREATE USER 'your_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON your_database.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

3. Deploy Application:
```bash
# Clone code
git clone <repository-url>
cd Server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env

# Run database migrations
npx prisma migrate deploy

# Start server
npm start
```

## Troubleshooting

Common Issues:

1. Database Connection Errors
   - Check database credentials
   - Ensure database service is running
   - Verify firewall settings
   - Check Prisma connection string

2. JWT Authentication Issues
   - Check JWT_SECRET configuration
   - Verify token format
   - Confirm token hasn't expired
   - Check token storage

3. Prisma Issues
   - Run `npx prisma generate`
   - Ensure schema is up to date
   - Check migration status
   - Verify database permissions

4. API Errors
   - Check request format
   - Verify authentication
   - Review error logs
   - Check rate limits

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[MIT License](LICENSE) 