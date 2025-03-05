# **User Management API**
This API manages user authentication and profile information.

## **Endpoints**
### **1. Get User Details**
#### **GET /api/user/{id}**
Retrieve detailed information about a user by their unique ID.

#### **Parameters**
| Name | In   | Type    | Required | Description            |
|------|------|---------|----------|------------------------|
| id   | path | integer | ✅       | The unique user ID. |

#### **Response**
✅ **200 OK**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "role": "pmm",
  "created_at": "2024-03-01T10:00:00Z",
  "updated_at": "2024-03-02T12:30:00Z"
}
```
❌ **404 Not Found** – User not found  
❌ **500 Internal Server Error** – Server error  

---
### **2. User Login**
#### **POST /api/user/login**
Authenticates a user using email and password.

#### **Request Body**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### **Response**
✅ **200 OK**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "pmm"
  }
}
```
❌ **400 Bad Request** – Invalid credentials  
❌ **500 Internal Server Error** – Server error  

---
### **3. User Registration**
#### **POST /api/user/register**
Registers a new user.

#### **Request Body**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "role": "pmm"
}
```

#### **Response**
✅ **201 Created**
```json
{
  "message": "User registered successfully.",
  "user": {
    "id": 2,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "pmm",
    "created_at": "2024-03-02T12:00:00Z"
  }
}
```
❌ **400 Bad Request** – Invalid input or user already exists  
❌ **500 Internal Server Error** – Server error  

---
### **4. User Logout**
#### **POST /api/user/logout**
Logs out the user and invalidates their session token.

#### **Response**
✅ **200 OK**
```json
{
  "message": "Logout successful."
}
```
❌ **500 Internal Server Error** – Server error  

---
This document provides a **structured API reference** with request parameters and example responses.