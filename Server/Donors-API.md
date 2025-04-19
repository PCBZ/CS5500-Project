## Donors API

### Get Donors List
Retrieves a list of donors with support for pagination, filtering, and sorting.

**Endpoint:** `GET /api/donors`

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of donors per page (default: 20)
- `sort` (optional): Field to sort by (e.g., "last_name", "total_donations")
- `order` (optional): Sort order ("asc" or "desc")
- `pmm` (optional): Filter by Prospect Move Manager
- `city` (optional): Filter by city
- `excluded` (optional): Filter by excluded status (true/false)
- `deceased` (optional): Filter by deceased status (true/false)
- `tags` (optional): Filter by tags (comma-separated)
- `minDonation` (optional): Filter by minimum total donation amount
- `search` (optional): Search term for name or organization

**Response Example:**
```json
{
  "donors": [
    {
      "_id": "60a1b2c3d4e5f6a1b2c3d4e5",
      "pmm": "Parvati Patel",
      "smm": "Bob Brown",
      "vmm": "Olga Smirnov",
      "excluded": false,
      "deceased": false,
      "first_name": "Mei",
      "nick_name": "Sunshine",
      "last_name": "Lee",
      "total_donations": 89267,
      "tags": ["High Priority", "Cancer Research Interest"]
    }
  ],
  "total": 85,
  "page": 1,
  "limit": 20,
  "pages": 5
}
```

### Get Donor by ID
Retrieves details for a specific donor by ID.

**Endpoint:** `GET /api/donors/{id}`

**Path Parameters:**
- `id`: Donor ID

**Response Example:**
```json
{
  "_id": "60a1b2c3d4e5f6a1b2c3d4e5",
  "constituentId": "D-10023",
  "pmm": "Parvati Patel",
  "smm": "Bob Brown",
  "vmm": "Olga Smirnov",
  "excluded": false,
  "deceased": false,
  "first_name": "Mei",
  "nick_name": "Sunshine",
  "last_name": "Lee",
  "organization_name": "",
  "total_donations": 89267,
  "total_pledges": 80,
  "largest_gift": 38384,
  "largest_gift_appeal": "Appeal2",
  "first_gift_date": "2000-05-15T00:00:00.000Z",
  "last_gift_date": "2023-11-30T00:00:00.000Z",
  "last_gift_amount": 7150,
  "last_gift_request": "",
  "last_gift_appeal": "Appeal3",
  "address_line1": "3707 Redwood Terrace",
  "address_line2": "Apt 444",
  "city": "North Vancouver",
  "contact_phone_type": "Home",
  "phone_restrictions": "Do Not Call",
  "email_restrictions": "No Surveys",
  "communication_restrictions": "Opt-out",
  "subscription_events_in_person": "Opt-in",
  "subscription_events_magazine": "Opt-out",
  "communication_preference": "Event",
  "tags": ["High Priority", "Cancer Research Interest"]
}
```

### Import Donors
Imports donor data from a CSV or Excel file.

**Endpoint:** `POST /api/donors/import`

**Request:**
- Content-Type: multipart/form-data
- Body: Form data with a file field containing the CSV or Excel file

**Response Example:**
```json
{
  "success": true,
  "imported": 127,
  "updated": 43,
  "errors": [
    {
      "row": 15,
      "error": "Missing required field: last_name"
    },
    {
      "row": 78,
      "error": "Invalid date format for last_gift_date"
    }
  ],
  "message": "Donor import completed with 2 errors"
}
```

### Smart Donor Filtering
The system supports advanced donor filtering through the `/api/donors` endpoint with query parameters. Complex filtering can combine multiple parameters to create targeted donor lists.

**Example of a complex filter:**
```
GET /api/donors?city=Vancouver&minDonation=10000&tags=Cancer%20Research%20Interest&excluded=false&deceased=false&limit=50
```

This would return up to 50 non-excluded, non-deceased donors from Vancouver with at least $10,000 in total donations who have the "Cancer Research Interest" tag.

Filtering can be based on:
- Demographic data (city, etc.)
- Giving history (donation amounts, dates)
- Relationship information (PMM assignments)
- Special designations (tags)
- Communication preferences
- Event participation history
