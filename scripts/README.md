# Test Data Upload Scripts

This directory contains scripts for uploading test data to the application via HTTP requests.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- A running instance of the application server

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure the server URL:
   - Open `uploadTestData.js`
   - Update the `API_URL` constant with your server's URL (default: 'http://localhost:3000')

## Usage

### Upload Test Data

To upload test data to the server:

```bash
node uploadTestData.js
```

This script will:
1. Create test events
2. Create test donors
3. Associate donors with events
4. Set initial statuses for event-donor relationships

### Test Data Structure

The test data includes:
- Events with various statuses (Planning, List Generation, Review, Ready, Complete)
- Donors with different types (Individual, Organization)
- Event-donor relationships with different statuses (Pending, Approved, Rejected)

## Error Handling

The script includes error handling for:
- Network errors
- Authentication failures
- Invalid data formats
- Server errors

## Notes

- The script uses JWT authentication
- Test data is designed to cover various use cases and edge cases
- The script can be modified to generate different types of test data

## Troubleshooting

If you encounter issues:

1. Check the server URL configuration
2. Ensure the server is running and accessible
3. Verify your authentication token is valid
4. Check the console output for detailed error messages

## Security Notes

- The script uses environment variables for sensitive data
- Test data should not be used in production environments
- Always use secure connections (HTTPS) in production 