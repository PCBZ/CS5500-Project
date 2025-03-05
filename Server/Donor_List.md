# **Donor List Management API**

## **Overview**
This API provides endpoints for managing donor lists, including retrieving, creating, updating, and deleting donor lists and their associated donors.

## **Endpoints**

### **1. Get All Donor Lists**
#### **GET /api/lists**
Retrieves a list of all donor lists.

#### **Query Parameters**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `page` | integer | No | Page number for pagination (default: 1) |
| `limit` | integer | No | Number of results per page (default: 10) |
| `status` | string | No | Filter by review status ('completed', 'pending') |

#### **Response**
✅ **200 OK**
```json
{
  "total_count": 25,
  "page": 1,
  "limit": 10,
  "lists": [
    {
      "id": 1,
      "event_id": 101,
      "name": "Summer Fundraiser 2024",
      "total_donors": 150,
      "approved": 120,
      "excluded": 15,
      "pending": 15,
      "auto_excluded": 5,
      "review_status": "pending",
      "created_at": "2024-03-01T10:00:00Z",
      "generated_by": 42
    },
    // ... more lists
  ]
}
```
❌ **500 Internal Server Error** – Server error

---
### **2. Get Donor List Details**
#### **GET /api/lists/{id}**
Retrieve detailed information about a specific donor list.

#### **Parameters**
| Name | In   | Type    | Required | Description |
|------|------|---------|----------|-------------|
| `id` | path | integer | ✅ | Unique donor list ID |

#### **Response**
✅ **200 OK**
```json
{
  "id": 1,
  "event_id": 101,
  "name": "Summer Fundraiser 2024",
  "total_donors": 150,
  "approved": 120,
  "excluded": 15,
  "pending": 15,
  "auto_excluded": 5,
  "review_status": "pending",
  "created_at": "2024-03-01T10:00:00Z",
  "updated_at": "2024-03-02T14:30:00Z",
  "generated_by": 42,
  "donors": [
    {
      "id": 201,
      "name": "John Doe",
      "status": "Approved",
      "exclude_reason": null,
      "reviewer_id": null,
      "review_date": null,
      "comments": null
    },
    // ... more donors
  ]
}
```
❌ **404 Not Found** – List not found
❌ **500 Internal Server Error** – Server error

---
### **3. Delete Donor List**
#### **DELETE /api/lists/{id}**
Delete a specific donor list.

#### **Parameters**
| Name | In   | Type    | Required | Description |
|------|------|---------|----------|-------------|
| `id` | path | integer | ✅ | Unique donor list ID |

#### **Response**
✅ **200 OK**
```json
{
  "message": "Donor list deleted successfully."
}
```
❌ **404 Not Found** – List not found
❌ **500 Internal Server Error** – Server error

---
### **4. Add Donors to List**
#### **POST /api/lists/{id}/donors**
Manually add donors to a specific list.

#### **Parameters**
| Name | In   | Type    | Required | Description |
|------|------|---------|----------|-------------|
| `id` | path | integer | ✅ | Unique donor list ID |

#### **Request Body**
```json
{
  "donors": [
    {
      "donor_id": 301,
      "status": "Pending",
      "comments": "Manually added donor"
    },
    {
      "donor_id": 302,
      "status": "Approved",
      "reviewer_id": 42
    }
  ]
}
```

#### **Response**
✅ **201 Created**
```json
{
  "message": "Donors added successfully.",
  "added_donors": [
    {
      "donor_id": 301,
      "status": "Pending"
    },
    {
      "donor_id": 302,
      "status": "Approved"
    }
  ]
}
```
❌ **400 Bad Request** – Invalid donor data
❌ **404 Not Found** – List not found
❌ **500 Internal Server Error** – Server error

---
### **5. Remove Donor from List**
#### **DELETE /api/lists/{id}/donors/{donorId}**
Remove a specific donor from a donor list.

#### **Parameters**
| Name | In   | Type    | Required | Description |
|------|------|---------|----------|-------------|
| `id` | path | integer | ✅ | Unique donor list ID |
| `donorId` | path | integer | ✅ | Unique donor ID |

#### **Response**
✅ **200 OK**
```json
{
  "message": "Donor removed from list successfully."
}
```
❌ **404 Not Found** – List or donor not found
❌ **500 Internal Server Error** – Server error

---
### **6. Update List Status**
#### **PUT /api/lists/{id}/status**
Change the review status of a donor list.

#### **Parameters**
| Name | In   | Type    | Required | Description |
|------|------|---------|----------|-------------|
| `id` | path | integer | ✅ | Unique donor list ID |

#### **Request Body**
```json
{
  "review_status": "completed"
}
```

#### **Response**
✅ **200 OK**
```json
{
  "message": "List status updated successfully.",
  "list": {
    "id": 1,
    "review_status": "completed",
    "updated_at": "2024-03-02T15:45:00Z"
  }
}
```
❌ **400 Bad Request** – Invalid status
❌ **404 Not Found** – List not found
❌ **500 Internal Server Error** – Server error

---
## **Status Codes**
- `200 OK`: Successful request
- `201 Created`: Resource successfully created
- `400 Bad Request`: Invalid input
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

## **Notes**
- All endpoints require authentication
- Status values for donors: 'Pending', 'Approved', 'Excluded', 'Auto Excluded'
- List review status values: 'completed', 'pending'