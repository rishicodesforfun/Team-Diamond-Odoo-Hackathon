# User & Team Management Feature

## Overview
Managers can now assign technicians to teams, and technicians are automatically assigned to their team when creating requests.

## Setup

### 1. Run Database Migration
```bash
cd backend
node migrate-add-user-team.js
```

This adds a `team_id` column to the `users` table.

### 2. Restart Backend Server
```bash
npm start
```

## Features

### For Managers

#### User Management Page (`/users`)
- View all users in the system
- See each user's role, email, and assigned team
- Assign users to teams
- Change user roles
- View user statistics

#### How to Assign a Team:
1. Navigate to Users page (visible only to managers)
2. Click "Assign Team" button next to a user
3. Select a team from the dropdown
4. Click "Save"

#### How to Change a Role:
1. Navigate to Users page
2. Use the role dropdown next to a user
3. Confirm the change

### For Technicians

When a technician creates a request:
- The team dropdown shows "Auto-assigned to you"
- The request is automatically assigned to their team (if they have one)
- They cannot manually select a different team

### For Employees

Employees can still select any team when creating requests (no auto-assignment).

## API Endpoints

### User Management Routes (`/api/users`)

All routes require authentication and manager role.

#### GET /users
Get all users with their team information.

**Response:**
```json
[
  {
    "id": 1,
    "email": "tech@example.com",
    "name": "John Technician",
    "role": "technician",
    "team_id": 2,
    "team_name": "Electrical Team",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET /users/technicians
Get only technicians.

#### PATCH /users/:id/team
Assign a user to a team.

**Request:**
```json
{
  "team_id": 2
}
```

**Response:**
```json
{
  "id": 1,
  "email": "tech@example.com",
  "name": "John Technician",
  "role": "technician",
  "team_id": 2
}
```

#### PATCH /users/:id/role
Change a user's role.

**Request:**
```json
{
  "role": "technician"
}
```

## Database Schema

### users table (updated)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'employee' 
    CHECK (role IN ('employee', 'technician', 'manager')),
  team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## UI Components

### UserManagement.jsx
- Full user management interface
- Table view of all users
- Inline team assignment
- Role change dropdown
- User statistics cards

### Updated Components
- **Layout.jsx**: Added "Users" link for managers
- **RequestsKanban.jsx**: Auto-assign technicians to their team
- **CalendarView.jsx**: Auto-assign technicians to their team
- **App.jsx**: Added `/users` route (manager only)

## Workflow Example

### Scenario: Assigning a Technician to a Team

1. **Manager logs in** with manager role
2. **Navigates to Users page** (visible in sidebar)
3. **Sees list of all users** including technicians
4. **Clicks "Assign Team"** next to a technician
5. **Selects "Electrical Team"** from dropdown
6. **Clicks "Save"**
7. **Technician is now assigned** to Electrical Team

### Scenario: Technician Creates a Request

1. **Technician logs in** (already assigned to Electrical Team)
2. **Navigates to Requests** or Calendar
3. **Clicks "Create Request"**
4. **Sees "Auto-assigned to you"** in team field
5. **Fills out request details**
6. **Submits request**
7. **Request is automatically assigned** to Electrical Team

## Benefits

✅ **Centralized Management**: Managers control team assignments
✅ **Automatic Assignment**: Technicians don't need to select teams
✅ **Clear Ownership**: Each technician belongs to a specific team
✅ **Audit Trail**: Team assignments are tracked in database
✅ **Flexible**: Managers can reassign technicians as needed
✅ **Role Management**: Managers can promote/demote users

## Security

- ✅ All user management routes require manager role
- ✅ Technicians cannot change their own team assignment
- ✅ Employees cannot access user management
- ✅ Role changes require confirmation
- ✅ Team assignments validated at database level

## Testing

### Test as Manager
1. Login as manager
2. Navigate to Users page
3. Assign a technician to a team
4. Change a user's role
5. Verify changes persist

### Test as Technician
1. Login as technician (assigned to a team)
2. Create a request
3. Verify team is auto-assigned
4. Verify cannot change team selection

### Test as Employee
1. Login as employee
2. Verify Users page is not visible
3. Create a request
4. Verify can select any team

## Future Enhancements

- [ ] Team-based request filtering
- [ ] Team performance analytics
- [ ] Bulk user operations
- [ ] User invitation system
- [ ] Team capacity management
- [ ] Workload distribution
