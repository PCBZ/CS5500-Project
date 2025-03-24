# Test Data Generation and Import Scripts

This directory contains two scripts for generating and importing test data:

1. `generateTestEvents.js` - Generates test event and donor data
2. `importTestEvents.js` - Imports the generated test data into the database

## Generating Test Data

The `generateTestEvents.js` script generates mock event and donor data in JSON format.

### Usage

```bash
node generateTestEvents.js [count] > testEvents.json
```

- `[count]` - Optional parameter specifying the number of events to generate, default is 10
- The script will generate 5 times the count of donors

### Example

```bash
# Generate 20 events and 100 donors as test data
node generateTestEvents.js 20 > testEvents.json
```

## Importing Test Data

The `importTestEvents.js` script imports the generated test data into the database.

### Prerequisites

1. Ensure database connection is configured (in the `.env` file)
2. Make sure at least one user (ID 1) exists in the database

### Usage

```bash
node importTestEvents.js <data_file_path>
```

- `<data_file_path>` - Required parameter specifying the path to the JSON file containing test data

### Example

```bash
# Import test data
node importTestEvents.js ./testEvents.json
```

## Data Structure

The generated test data includes the following structure:

1. `MOCK_EVENTS` - Array of event data
2. `MOCK_DONORS` - Array of donor data
3. `MOCK_EVENT_DONORS` - Event and donor relationship mapping
4. `MOCK_EVENT_STATS` - Event donor statistics

## Important Notes

- These scripts are for development and testing environments only, do not use in production
- The import script creates new data records but does not delete existing data
- Make sure to backup your database before importing to prevent unexpected issues

## Generated Data Ranges

### Event Data
- Event types: Major Donor Event, Research Symposium, Community Event, etc.
- Event locations: Major city convention centers
- Event focus areas: Cancer Research, Children's Health, Medical Innovation, etc.
- Event statuses: Planning, ListGeneration, Review, Ready, Complete
- Event dates: From current date to two years in the future

### Donor Data
- Individual donors (70%): Randomly generated names
- Organization donors (30%): Randomly generated company names
- Donation amounts: Between 10,000 and 1,000,000
- Donor types: Major Donor, Corporate Donor, Individual Donor, etc.
- Priorities: High, Medium, Low
- Tags: 1-3 randomly selected interest/characteristic tags 