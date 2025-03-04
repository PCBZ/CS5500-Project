# Database Design Document

## Database Overview

This database is designed to manage users, donors, events, and event-specific donor lists. It leverages a relational database (MySQL) to ensure data consistency, scalability, and efficient querying. The system supports user roles, event management, donor tracking, and donor review workflows.

## Table Structures

### 1. `user` (User)
Stores user.

| Column Name    | Data Type         | Constraints                                      | Description                         |
|---------------|------------------|------------------------------------------------|-------------------------------------|
| id            | BIGINT PRIMARY KEY AUTO_INCREMENT | NOT NULL | User ID |
| name          | VARCHAR(255)     | NOT NULL | User name |
| email         | VARCHAR(255)     | NOT NULL | Email address (unique for login) |
| password      | VARCHAR(255)     | NOT NULL | Hashed password for authentication |
| role          | ENUM('pmm', 'smm', 'vmm') | DEFAULT 'pmm' | User role: pmm (default), smm, or vmm |


### 1. `event_donor_list` (Event Donor List)
Stores donor lists for each event.

| Column Name    | Data Type         | Constraints                                      | Description                         |
|---------------|------------------|------------------------------------------------|-------------------------------------|
| id            | BIGINT PRIMARY KEY AUTO_INCREMENT | NOT NULL | Event donor list ID |
| event_id      | BIGINT           | NOT NULL, FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) | Associated event ID |
| name          | VARCHAR(255)     | NOT NULL | Donor list name |
| total_donors  | INT              | DEFAULT 0 | Total number of donors |
| approved      | INT              | DEFAULT 0 | Number of approved donors |
| excluded      | INT              | DEFAULT 0 | Number of excluded donors |
| pending       | INT              | DEFAULT 0 | Number of pending donors |
| auto_excluded | INT              | DEFAULT 0 | Number of automatically excluded donors |
| review_status | ENUM('completed', 'pending') | DEFAULT 'pending' | Review status |
| created_at    | DATETIME         | DEFAULT CURRENT_TIMESTAMP | Creation time |
| updated_at    | DATETIME         | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Update time |
| generated_by  | BIGINT           | FOREIGN KEY (`generated_by`) REFERENCES `user`(`id`) | User ID who generated the list |

### 2. `event_donor` (Event-Donor Relationship Table)
Links `event_donor_list` with `donor`, storing donor review statuses.

| Column Name   | Data Type        | Constraints                                      | Description               |
|--------------|-----------------|------------------------------------------------|---------------------------|
| id           | BIGINT PRIMARY KEY AUTO_INCREMENT | NOT NULL | Relationship ID |
| donor_list_id | BIGINT         | NOT NULL, FOREIGN KEY (`donor_list_id`) REFERENCES `event_donor_list`(`id`) | Associated donor list ID |
| donor_id     | BIGINT          | NOT NULL, FOREIGN KEY (`donor_id`) REFERENCES `donor`(`id`) | Associated donor ID |
| status       | ENUM('Pending', 'Approved', 'Excluded', 'Auto Excluded') | NOT NULL | Review status |
| exclude_reason | VARCHAR(255)  | NULL | Exclusion reason (if any) |
| reviewer_id  | BIGINT          | FOREIGN KEY (`reviewer_id`) REFERENCES `user`(`id`) | Reviewer ID (if any) |
| review_date  | DATETIME        | NULL | Review date |
| comments     | TEXT            | NULL | Remarks |
| auto_excluded | BOOLEAN        | DEFAULT FALSE | Whether automatically excluded |

### 3. `donor` (Donor Information Table)
Stores basic information about all donors.

| Column Name   | Data Type        | Constraints                                      | Description               |
|--------------|-----------------|------------------------------------------------|---------------------------|
| id           | BIGINT PRIMARY KEY AUTO_INCREMENT | NOT NULL | Donor ID |
| name         | VARCHAR(255)     | NOT NULL | Donor name |

## Relationship Diagram

```
+------------------+     +---------------+     +-------------+
| event_donor_list |     | event_donor   |     | donor       |
+------------------+     +---------------+     +-------------+
| id (PK)          |<----| donor_list_id |     | id (PK)     |
| event_id (FK)    |     | donor_id (FK) |---->| name        |
| name             |     | status        |     | email       |
| total_donors     |     | exclude_reason|     | phone       |
| generated_by (FK)|     | reviewer_id   |     +-------------+
+------------------+     +---------------+
         |                        |
         |                        |
+--------|---------+    +---------|----------+
| event            |    | user              |
+------------------+    +-------------------+
| id (PK)          |    | id (PK)          |
| name             |    | name             |
| start_date       |    | email            |
| created_by (FK)  |    | role             |
+------------------+    +-------------------+
```


## Design Decisions
- **`event_donor_list` only stores basic list information and does not store a `donor_ids` array** to avoid redundant data.
- **`event_donor` serves as a junction table** recording each `donor`'s status in an `event_donor_list`.
- **Foreign key constraints** ensure data integrity and prevent invalid references.

---

