# BC Cancer Foundation Donor Management System

## Overview
This API provides endpoints for managing donors and events for the BC Cancer Foundation's Donor Management System.

## Table of Contents
- [Events API](#events-api)
  - [Get Events List](#get-events-list)
  - [Create New Event](#create-new-event)
  - [Get Event by ID](#get-event-by-id)
  - [Update Event](#update-event)
  - [Delete Event](#delete-event)
  - [Update Event Status](#update-event-status)
  - [Get Events by Status](#get-events-by-status)

## Events API

### Get Events List
Retrieves a list of all events with support for pagination, filtering, and sorting.

**Endpoint:** `GET /api/events`

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of events per page (default: 10)
- `sort` (optional): Field to sort by (e.g., "date", "name")
- `order` (optional): Sort order ("asc" or "desc")
- `type` (optional): Filter by event type
- `location` (optional): Filter by event location
- `status` (optional): Filter by event status
- `fromDate` (optional): Filter events after this date
- `toDate` (optional): Filter events before this date

**Response Example:**
```json
{
  "events": [
    {
      "_id": "60a1b2c3d4e5f6a1b2c3d4e5",
      "name": "Spring Gala 2025",
      "type": "Major Donor Event",
      "date": "2025-03-15T00:00:00.000Z",
      "location": "Vancouver",
      "capacity": 200,
      "status": "Planning"
    }
  ],
  "total": 24,
  "page": 1,
  "limit": 10,
  "pages": 3
}
```

### Create New Event
Creates a new event.

**Endpoint:** `POST /api/events`

**Request Body:**
```json
{
  "name": "Spring Gala 2025",
  "type": "Major Donor Event",
  "date": "2025-03-15",
  "location": "Vancouver",
  "capacity": 200,
  "focus": "Cancer Research",
  "criteriaMinGivingLevel": 25000,
  "timelineListGenerationDate": "2025-01-15",
  "timelineReviewDeadline": "2025-02-15",
  "timelineInvitationDate": "2025-02-25",
  "status": "Planning"
}
```

**Response Example:**
```json
{
  "_id": "60a1b2c3d4e5f6a1b2c3d4e5",
  "name": "Spring Gala 2025",
  "type": "Major Donor Event",
  "date": "2025-03-15T00:00:00.000Z",
  "location": "Vancouver",
  "capacity": 200,
  "focus": "Cancer Research",
  "criteriaMinGivingLevel": 25000,
  "timelineListGenerationDate": "2025-01-15T00:00:00.000Z",
  "timelineReviewDeadline": "2025-02-15T00:00:00.000Z",
  "timelineInvitationDate": "2025-02-25T00:00:00.000Z",
  "status": "Planning",
  "metadataCreatedAt": "2024-03-05T12:34:56.789Z",
  "metadataUpdatedAt": "2024-03-05T12:34:56.789Z",
  "metadataCreatedBy": "60a1b2c3d4e5f6a1b2c3d4e5"
}
```

### Get Event by ID
Retrieves details for a specific event by its ID.

**Endpoint:** `GET /api/events/{id}`

**Path Parameters:**
- `id`: Event ID

**Response Example:**
```json
{
  "_id": "60a1b2c3d4e5f6a1b2c3d4e5",
  "name": "Spring Gala 2025",
  "type": "Major Donor Event",
  "date": "2025-03-15T00:00:00.000Z",
  "location": "Vancouver",
  "capacity": 200,
  "focus": "Cancer Research",
  "criteriaMinGivingLevel": 25000,
  "timelineListGenerationDate": "2025-01-15T00:00:00.000Z",
  "timelineReviewDeadline": "2025-02-15T00:00:00.000Z",
  "timelineInvitationDate": "2025-02-25T00:00:00.000Z",
  "status": "Planning",
  "metadataCreatedAt": "2024-03-05T12:34:56.789Z",
  "metadataUpdatedAt": "2024-03-05T12:34:56.789Z",
  "metadataCreatedBy": "60a1b2c3d4e5f6a1b2c3d4e5"
}
```

### Update Event
Updates an existing event.

**Endpoint:** `PUT /api/events/{id}`

**Path Parameters:**
- `id`: Event ID

**Request Body:**
```json
{
  "name": "Spring Gala 2025 - Updated",
  "capacity": 250,
  "focus": "Brain Cancer Research"
}
```

**Response Example:**
```json
{
  "_id": "60a1b2c3d4e5f6a1b2c3d4e5",
  "name": "Spring Gala 2025 - Updated",
  "type": "Major Donor Event",
  "date": "2025-03-15T00:00:00.000Z",
  "location": "Vancouver",
  "capacity": 250,
  "focus": "Brain Cancer Research",
  "criteriaMinGivingLevel": 25000,
  "timelineListGenerationDate": "2025-01-15T00:00:00.000Z",
  "timelineReviewDeadline": "2025-02-15T00:00:00.000Z",
  "timelineInvitationDate": "2025-02-25T00:00:00.000Z",
  "status": "Planning",
  "metadataCreatedAt": "2024-03-05T12:34:56.789Z",
  "metadataUpdatedAt": "2024-03-05T14:45:23.456Z",
  "metadataCreatedBy": "60a1b2c3d4e5f6a1b2c3d4e5"
}
```

### Delete Event
Soft deletes an event (marks as inactive without removing from database).

**Endpoint:** `DELETE /api/events/{id}`

**Path Parameters:**
- `id`: Event ID

**Response Example:**
```json
{
  "success": true,
  "message": "Event successfully deleted"
}
```

### Update Event Status
Updates the status of an event.

**Endpoint:** `PUT /api/events/{id}/status`

**Path Parameters:**
- `id`: Event ID

**Request Body:**
```json
{
  "status": "Review"
}
```

**Response Example:**
```json
{
  "_id": "60a1b2c3d4e5f6a1b2c3d4e5",
  "name": "Spring Gala 2025",
  "status": "Review",
  "metadataUpdatedAt": "2024-03-05T15:12:34.567Z"
}
```

### Get Events by Status
Retrieves all events with a specific status.

**Endpoint:** `GET /api/events/status/{status}`

**Path Parameters:**
- `status`: Event status ("Planning", "ListGeneration", "Review", "Ready", or "Complete")

**Response Example:**
```json
[
  {
    "_id": "60a1b2c3d4e5f6a1b2c3d4e5",
    "name": "Spring Gala 2025",
    "type": "Major Donor Event",
    "date": "2025-03-15T00:00:00.000Z",
    "status": "Review"
  }
]
```
