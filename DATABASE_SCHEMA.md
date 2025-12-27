# Database Schema - GearGuard

Complete PostgreSQL database schema for the GearGuard Smart Maintenance Planner application.

## Tables Overview

1. **users** - User accounts and authentication
2. **teams** - Maintenance teams
3. **equipment** - Assets (machines, vehicles, equipment)
4. **requests** - Maintenance requests (core business logic)

---

## Table: `users`

Stores user account information for authentication.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing user ID |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User email address (unique) |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `name` | VARCHAR(255) | NOT NULL | User's full name |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |

### SQL Definition:
```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Table: `teams`

Stores maintenance team information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing team ID |
| `name` | VARCHAR(255) | NOT NULL | Team name |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Team creation timestamp |

### SQL Definition:
```sql
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Relationships:
- Referenced by: `equipment.maintenance_team_id`
- Referenced by: `requests.team_id`

---

## Table: `equipment`

Stores equipment/asset information (machines, vehicles, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing equipment ID |
| `name` | VARCHAR(255) | NOT NULL | Equipment name |
| `category` | VARCHAR(100) | NULL | Equipment category (e.g., "Electrical", "Mechanical") |
| `location` | VARCHAR(255) | NULL | Equipment location |
| `maintenance_team_id` | INTEGER | FOREIGN KEY → teams(id) | Assigned maintenance team |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Equipment creation timestamp |

### SQL Definition:
```sql
CREATE TABLE IF NOT EXISTS equipment (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  location VARCHAR(255),
  maintenance_team_id INTEGER REFERENCES teams(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Relationships:
- Foreign Key: `maintenance_team_id` → `teams(id)`
- Referenced by: `requests.equipment_id` (CASCADE DELETE)

---

## Table: `requests` (CORE TABLE)

Stores maintenance requests - the core business logic table that powers both Kanban board and Calendar view.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing request ID |
| `equipment_id` | INTEGER | FOREIGN KEY → equipment(id), NOT NULL | Associated equipment |
| `team_id` | INTEGER | FOREIGN KEY → teams(id), NULL | Assigned maintenance team |
| `user_id` | INTEGER | FOREIGN KEY → users(id), NULL | User who created the request |
| `type` | VARCHAR(50) | NOT NULL, CHECK IN ('corrective', 'preventive') | Request type: corrective (breakdown) or preventive (scheduled) |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT 'new', CHECK IN ('new', 'in_progress', 'repaired', 'scrap') | Request status for Kanban workflow |
| `title` | VARCHAR(255) | NOT NULL | Request title/name |
| `description` | TEXT | NULL | Detailed description |
| `scheduled_date` | DATE | NULL | Scheduled date for calendar view |
| `start_time` | TIME | NULL | Start time for calendar scheduling |
| `duration_hours` | DECIMAL(4,2) | DEFAULT 1.0 | Duration in hours |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Request creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

### SQL Definition:
```sql
CREATE TABLE IF NOT EXISTS requests (
  id SERIAL PRIMARY KEY,
  equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
  team_id INTEGER REFERENCES teams(id),
  user_id INTEGER REFERENCES users(id),
  type VARCHAR(50) NOT NULL CHECK (type IN ('corrective', 'preventive')),
  status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'repaired', 'scrap')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_date DATE,
  start_time TIME,
  duration_hours DECIMAL(4,2) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Relationships:
- Foreign Key: `equipment_id` → `equipment(id)` (CASCADE DELETE - if equipment is deleted, requests are deleted)
- Foreign Key: `team_id` → `teams(id)`
- Foreign Key: `user_id` → `users(id)`

### Constraints:
- `type` must be either 'corrective' or 'preventive'
- `status` must be one of: 'new', 'in_progress', 'repaired', 'scrap'
- Default status is 'new'
- Default duration is 1.0 hours

---

## Indexes

Performance indexes for common query patterns:

### Index: `idx_requests_status`
```sql
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
```
**Purpose:** Fast filtering by status (for Kanban board columns)

### Index: `idx_requests_scheduled_date`
```sql
CREATE INDEX IF NOT EXISTS idx_requests_scheduled_date ON requests(scheduled_date);
```
**Purpose:** Fast date range queries (for Calendar view)

### Index: `idx_requests_equipment_id`
```sql
CREATE INDEX IF NOT EXISTS idx_requests_equipment_id ON requests(equipment_id);
```
**Purpose:** Fast lookup of requests by equipment

---

## Entity Relationship Diagram (ERD)

```
┌─────────────┐
│    users    │
├─────────────┤
│ id (PK)     │
│ email       │◄─────┐
│ password    │      │
│ name        │      │
│ created_at  │      │
└─────────────┘      │
                     │
┌─────────────┐      │
│    teams    │      │
├─────────────┤      │
│ id (PK)     │      │
│ name        │      │
│ created_at  │      │
└─────────────┘      │
      │              │
      │              │
      │              │
      ▼              │
┌─────────────┐      │
│  equipment  │      │
├─────────────┤      │
│ id (PK)     │      │
│ name        │      │
│ category    │      │
│ location    │      │
│ team_id (FK)│──────┘
│ created_at  │
└─────────────┘
      │
      │ (CASCADE)
      │
      ▼
┌─────────────┐
│  requests   │
├─────────────┤
│ id (PK)     │
│ equipment_id│──────┐
│ team_id (FK)│      │
│ user_id (FK)│      │
│ type        │      │
│ status      │      │
│ title       │      │
│ description │      │
│ scheduled_  │      │
│   date      │      │
│ start_time  │      │
│ duration    │      │
│ created_at  │      │
│ updated_at  │      │
└─────────────┘      │
                     │
                     │
                     │
            ┌────────┘
            │
            ▼
      ┌─────────────┐
      │  equipment  │
      └─────────────┘
```

---

## Data Flow

### Request Types:
- **Corrective**: Breakdown/repair requests (reactive maintenance)
- **Preventive**: Scheduled maintenance (proactive maintenance)

### Status Flow (Kanban):
```
new → in_progress → repaired → scrap
```

### Calendar Integration:
- Requests with `scheduled_date` and `start_time` appear in calendar
- `duration_hours` determines block height in calendar view

---

## Sample Queries

### Get all requests with equipment and team info:
```sql
SELECT r.*, 
       e.name as equipment_name, 
       e.category as equipment_category,
       t.name as team_name,
       u.name as user_name
FROM requests r
LEFT JOIN equipment e ON r.equipment_id = e.id
LEFT JOIN teams t ON r.team_id = t.id
LEFT JOIN users u ON r.user_id = u.id
ORDER BY r.created_at DESC;
```

### Get calendar events for a date range:
```sql
SELECT r.id,
       r.title,
       r.scheduled_date as date,
       r.start_time as "startTime",
       r.duration_hours as "durationHours",
       r.status,
       r.type,
       e.name as equipment_name
FROM requests r
LEFT JOIN equipment e ON r.equipment_id = e.id
WHERE r.scheduled_date IS NOT NULL
  AND r.scheduled_date >= '2025-01-01'
  AND r.scheduled_date <= '2025-12-31'
ORDER BY r.scheduled_date, r.start_time;
```

### Get dashboard statistics:
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'new') as new_count,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
  COUNT(*) FILTER (WHERE status = 'repaired') as repaired_count,
  COUNT(*) FILTER (WHERE status = 'scrap') as scrap_count,
  COUNT(*) FILTER (WHERE type = 'corrective') as corrective_count,
  COUNT(*) FILTER (WHERE type = 'preventive') as preventive_count,
  COUNT(*) as total_count
FROM requests;
```

---

## Notes

- All tables use `SERIAL` (auto-incrementing) primary keys
- Timestamps use `CURRENT_TIMESTAMP` as default
- Foreign keys maintain referential integrity
- `requests.equipment_id` has `ON DELETE CASCADE` - deleting equipment deletes its requests
- Indexes optimize common query patterns (status, date, equipment lookups)
- The `requests` table is the core table that powers both Kanban and Calendar views

