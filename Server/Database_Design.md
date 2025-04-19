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

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| _id | ObjectId | PRIMARY KEY | Unique identifier for the donor |
| pmm | String | | Prospect Move Manager (e.g., "Parvati Patel") |
| smm | String | | Secondary Move Manager (e.g., "Bob Brown") |
| vmm | String | | Volunteer Move Manager (e.g., "Olga Smirnov") |
| excluded | Boolean | NOT NULL, DEFAULT false | Whether donor is excluded (yes/no) |
| deceased | Boolean | NOT NULL, DEFAULT false | Whether donor is deceased (yes/no) |
| first_name | String | | First name (e.g., "Mei") |
| nick_name | String | | Nickname (e.g., "Sunshine") |
| last_name | String | | Last name (e.g., "Lee") |
| organization_name | String | | Organization name for corporate donors |
| total_donations | Number | NOT NULL, DEFAULT 0 | Total donations amount |
| total_pledges | Number | DEFAULT 0 | Total pledges amount |
| largest_gift | Number | DEFAULT 0 | Largest gift amount |
| largest_gift_appeal | String | | Appeal associated with largest gift (e.g., "Appeal2") |
| first_gift_date | Date | | Date of first gift |
| last_gift_date | Date | | Date of last gift |
| last_gift_amount | Number | DEFAULT 0 | Amount of last gift |
| last_gift_request | String | | Request associated with last gift |
| last_gift_appeal | String | | Appeal associated with last gift (e.g., "Appeal3") |
| address_line1 | String | | Address line 1 (e.g., "3707 Redwood Terrace") |
| address_line2 | String | | Address line 2 (e.g., "Apt 444") |
| city | String | | City (e.g., "North Vancouver") |
| contact_phone_type | String | CHECK (contact_phone_type IN ('Home','Mobile','Work','Other')) | Phone type (e.g., "Home", "Mobile") |
| phone_restrictions | String | | Phone contact restrictions (e.g., "Do Not Call") |
| email_restrictions | String | | Email contact restrictions (e.g., "No Surveys") |
| communication_restrictions | String | | General communication restrictions (e.g., "Opt-out") |
| subscription_events_in_person | String | CHECK (subscription_events_in_person IN ('Opt-in','Opt-out')) | In-person event subscription status (e.g., "Opt-in") |
| subscription_events_magazine | String | CHECK (subscription_events_magazine IN ('Opt-in','Opt-out')) | Magazine subscription status (e.g., "Opt-out") |
| communication_preference | String | | Preferred communication method (e.g., "Event", "Newsletter") |
| tags | Array[String] | | Array of tags for the donor |


### 4. `Event` (Event Information Table)

Stores information about fundraising and donor events.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| _id | ObjectId | PRIMARY KEY | Unique identifier for the event |
| name | String | NOT NULL | Event name (e.g., "Spring Gala 2025") |
| type | String | NOT NULL | Event type (e.g., "Major Donor Event") |
| date | Date | NOT NULL | Event date |
| location | String | NOT NULL | Event location (e.g., "Vancouver") |
| capacity | Number | DEFAULT 0 | Maximum number of attendees |
| focus | String | | Primary focus area (e.g., "Cancer Research") |
| criteriaMinGivingLevel | Number | DEFAULT 0 | Minimum donation amount for eligibility |
| timelineListGenerationDate | Date | | Date when donor list should be generated |
| timelineReviewDeadline | Date | | Deadline for PMMs to complete reviews |
| timelineInvitationDate | Date | | Date when invitations should be sent |
| status | String | NOT NULL, CHECK (status IN ('Planning','ListGeneration','Review','Ready','Complete')) | "Planning" \| "ListGeneration" \| "Review" \| "Ready" \| "Complete" |
| metadataCreatedAt | Date | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| metadataUpdatedAt | Date | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Record last update timestamp |
| metadataCreatedBy | String | NOT NULL | User ID of creator |

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

## DonorsTags (Common Tags Reference)

Tags are used to categorize and provide additional information about donors. They are stored as an array of strings in the donor document.

| Tag Name | Description |
|----------|-------------|
| High Priority | Donors requiring special attention |
| Cancer Research Interest | Donors interested in supporting cancer research |
| Equipment Interest | Donors interested in supporting equipment purchases |
| Patient Care Interest | Donors interested in supporting patient care initiatives |
| Corporate | Corporate donor |
| Never Invite - Link to Individual | Donors who should not be invited directly |
| Family Foundation | Family foundation donor |
| Board Member | Current or former board member |
| Major Donor | Donors with large contributions |
| Monthly Donor | Donors who contribute monthly |
| Planned Giving | Donors with planned giving arrangements |

## Design Decisions
- **`event_donor_list` only stores basic list information and does not store a `donor_ids` array** to avoid redundant data.
- **`event_donor` serves as a junction table** recording each `donor`'s status in an `event_donor_list`.
- **Foreign key constraints** ensure data integrity and prevent invalid references.

---

