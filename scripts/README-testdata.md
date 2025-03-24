# Test Data Generation Script

This is a standalone script for generating test event data without requiring Prisma or any database dependencies.

## Features

- Generates realistic test events with related donor data
- Outputs in either JSON or SQL format
- Creates relationships between events and donors
- Includes statistical data for events

## Usage

```bash
# Generate data in JSON format (default)
node scripts/generateTestData.js [count] > testEvents.json

# Generate SQL insert statements
node scripts/generateTestData.js [count] sql > testEvents.sql
```

Parameters:
- `[count]` - Optional number of events to generate (default: 10)
- Output format parameter - Optional "sql" to generate SQL statements instead of JSON

## Examples

```bash
# Generate 20 events with related donors in JSON format
node scripts/generateTestData.js 20 > testEvents.json

# Generate 15 events with SQL insert statements
node scripts/generateTestData.js 15 sql > testEvents.sql
```

## JSON Output Format

The generated JSON contains these main sections:

```json
{
  "MOCK_EVENTS": [...],
  "MOCK_DONORS": [...],
  "MOCK_EVENT_DONORS": {...},
  "MOCK_EVENT_STATS": {...}
}
```

- `MOCK_EVENTS` - Array of event objects
- `MOCK_DONORS` - Array of donor objects
- `MOCK_EVENT_DONORS` - Object mapping event IDs to arrays of donor IDs
- `MOCK_EVENT_STATS` - Object with statistics about donors for each event

## SQL Output Format

The SQL output generates:

1. `INSERT` statements for events
2. `INSERT` statements for donors
3. `INSERT` statements for event donor lists

The SQL is generated as a transaction with proper escaping and formatting.

## Using the Generated Data

### JSON Data

You can use the JSON data for:
- Frontend development and testing
- Populating a mock API server
- Importing into your application's state management

### SQL Data

The SQL data can be imported directly into your database:

```bash
# MySQL
mysql -u username -p database_name < testEvents.sql

# PostgreSQL
psql -U username -d database_name -f testEvents.sql
```

Note: You may need to modify column names in the generated SQL to match your actual database schema.

## API Upload Tool

This repository includes a tool to upload the generated JSON data directly to your application's API:

```bash
# Upload generated JSON data to API
node scripts/uploadTestData.js <json_file_path> [base_url]
```

Parameters:
- `<json_file_path>` - Required path to the generated JSON file
- `[base_url]` - Optional API base URL (default: http://localhost:3000)

Example:
```bash
# Generate 10 events and save to JSON file
node scripts/generateTestData.js 10 > testEvents.json

# Upload the generated data to the API
node scripts/uploadTestData.js testEvents.json http://localhost:3000
```

The upload tool will:
1. Prompt for API credentials (email/password)
2. Upload all events from the JSON file
3. Upload all donors from the JSON file
4. Create associations between events and donors

This provides a complete test data set in your application without requiring direct database access.

## Data Ranges

The script generates a variety of realistic data:

- Events: Future dates, various types and locations
- Donors: Mix of individuals and organizations
- Donation amounts: Between $10,000 and $1,000,000
- Relationships: 15-50 donors per event

## License

This script is provided for development and testing purposes only. 