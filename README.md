# GearGuard – Smart Maintenance Planner

GearGuard is a maintenance‑first asset management system designed to help organizations efficiently track equipment, manage maintenance workflows, and plan preventive operations using a unified, time‑centric interface.

The system combines asset management, maintenance request workflows, kanban tracking, and a weekly maintenance calendar into a single, coherent platform suitable for operational teams and technical reviewers.

## Overview

GearGuard focuses on three core dimensions of maintenance operations:

**Assets** – What needs to be maintained

**Teams** – Who is responsible for maintenance

**Time** – When maintenance is scheduled or performed

By unifying these dimensions, GearGuard enables teams to move away from fragmented tools and spreadsheets toward a structured, visual, and reliable maintenance workflow.

## MVP Features

- ✅ Authentication using JWT (Signup / Login with Employee ID validation)
- ✅ Equipment and asset management (machines, vehicles, infrastructure)
- ✅ Maintenance request handling:
  - Corrective (breakdown-driven)
  - Preventive (scheduled)
- ✅ Weekly maintenance calendar with hour-level scheduling
- ✅ Kanban board for request lifecycle management
- ✅ Dashboard with summary statistics and quick actions
- ✅ Role-Based Access Control (RBAC) with Employee/Technician/Manager roles
- ✅ User management system
- ✅ Basic maintenance team management

## Architecture

### Backend (backend/)
- Node.js with Express (RESTful API)
- PostgreSQL (single relational database)
- JWT-based authentication with RBAC
- Modular, domain-driven folder structure

**Backend Modules:**
- `auth/` – Authentication, JWT issuance, RBAC authorization middleware
- `equipment/` – Asset and equipment management
- `teams/` – Maintenance team definitions
- `requests/` – Core maintenance logic (calendar + kanban)
- `users/` – User management and role administration
- `db/` – Database connection and schema initialization

### Frontend (frontend/)
- React with Vite for fast development
- Client-side routing with role-based UI restrictions
- Modular UI aligned with backend domains

**Frontend Modules:**
- `auth/` – Login and signup views with validation
- `equipment/` – Asset listing and detail views
- `teams/` – Team overview and management
- `requests/` – Kanban board with drag-and-drop
- `calendar/` – Weekly maintenance calendar
- `users/` – User management interface
- `api/` – Centralized API request wrappers

## Quick Setup Guide

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb gearguard

# Or using psql:
psql -U postgres
CREATE DATABASE gearguard;
\q
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file
cat > .env << EOF
PORT=3001
DATABASE_URL=postgresql://localhost:5432/gearguard
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
EOF

# Start server (tables will auto-create on first run)
npm start
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Access the App

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### 5. First Steps

1. Sign up for a new account (includes Employee ID validation)
2. Create a team (Teams page - Manager only)
3. Add equipment (Equipment page - Manager only)
4. Create a maintenance request (Calendar or Requests page)
5. View in Kanban board (Requests page)

### Troubleshooting

**Database Connection Error**
- Ensure PostgreSQL is running
- Check DATABASE_URL in backend/.env
- Verify database exists: `psql -l | grep gearguard`

**Port Already in Use**
- Change PORT in backend/.env
- Update frontend/vite.config.js proxy target

**CORS Issues**
- Backend CORS is configured for localhost:3000
- If using different port, update backend/src/index.js CORS settings

## Database Schema

### Tables Overview

1. **users** - User accounts and authentication with RBAC roles
2. **teams** - Maintenance teams
3. **equipment** - Assets (machines, vehicles, equipment)
4. **requests** - Maintenance requests (core business logic)

### Table: `users`

Stores user account information for authentication with role-based permissions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing user ID |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User email address (unique) |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `name` | VARCHAR(255) | NOT NULL | User's full name |
| `role` | VARCHAR(50) | DEFAULT 'employee', CHECK IN ('employee', 'technician', 'manager') | User role for RBAC |
| `team_id` | INTEGER | FOREIGN KEY → teams(id) | User's assigned team |
| `employee_id` | VARCHAR(6) | UNIQUE | 6-digit employee ID |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |

### Table: `teams`

Stores maintenance team information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing team ID |
| `name` | VARCHAR(255) | NOT NULL | Team name |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Team creation timestamp |

**Relationships:**
- Referenced by: `equipment.maintenance_team_id`
- Referenced by: `requests.team_id`
- Referenced by: `users.team_id`

### Table: `equipment`

Stores equipment/asset information (machines, vehicles, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing equipment ID |
| `name` | VARCHAR(255) | NOT NULL | Equipment name |
| `category` | VARCHAR(100) | NULL | Equipment category (e.g., "Electrical", "Mechanical") |
| `location` | VARCHAR(255) | NULL | Equipment location |
| `maintenance_team_id` | INTEGER | FOREIGN KEY → teams(id) | Assigned maintenance team |
| `is_usable` | BOOLEAN | DEFAULT TRUE | Equipment usability status |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Equipment creation timestamp |

**Relationships:**
- Foreign Key: `maintenance_team_id` → `teams(id)`
- Referenced by: `requests.equipment_id` (CASCADE DELETE)

### Table: `requests` (CORE TABLE)

Stores maintenance requests - the core business logic table that powers both Kanban board and Calendar view.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing request ID |
| `equipment_id` | INTEGER | FOREIGN KEY → equipment(id), NOT NULL | Associated equipment |
| `team_id` | INTEGER | FOREIGN KEY → teams(id), NULL | Assigned maintenance team |
| `user_id` | INTEGER | FOREIGN KEY → users(id), NULL | User who created the request |
| `assigned_technician_id` | INTEGER | FOREIGN KEY → users(id) | Technician assigned to request |
| `type` | VARCHAR(50) | NOT NULL, CHECK IN ('corrective', 'preventive') | Request type: corrective (breakdown) or preventive (scheduled) |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT 'new', CHECK IN ('new', 'in_progress', 'repaired', 'scrap') | Request status for Kanban workflow |
| `title` | VARCHAR(255) | NOT NULL | Request title/name |
| `description` | TEXT | NULL | Detailed description |
| `scheduled_date` | DATE | NULL | Scheduled date for calendar view |
| `start_time` | TIME | NULL | Start time for calendar scheduling |
| `duration_hours` | DECIMAL(4,2) | DEFAULT 1.0 | Duration in hours |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Request creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Constraints:**
- `type` must be either 'corrective' or 'preventive'
- `status` must be one of: 'new', 'in_progress', 'repaired', 'scrap'
- Default status is 'new'
- Default duration is 1.0 hours

## Role-Based Access Control (RBAC)

### Roles
- **Employee**: Basic user with limited permissions
- **Technician**: Maintenance worker with moderate permissions
- **Manager**: Full administrative access

### Frontend UI Restrictions

#### Layout.jsx
- **Teams Navigation**: Only visible to Managers
- **User Role Display**: Shows user's role in the header subtitle

#### RequestsKanban.jsx (Requests Page)

**Managers (Full Access)**
- ✅ Can create both Corrective and Preventive requests
- ✅ Can assign requests to any team
- ✅ Can drag-and-drop cards between columns

**Technicians**
- ✅ Can create Corrective requests only
- ❌ Cannot create Preventive requests
- ⚠️ Auto-assigned to themselves (team dropdown hidden)
- ✅ Can drag-and-drop cards between columns

**Employees**
- ✅ Can create Corrective requests only
- ❌ Cannot create Preventive requests
- ✅ Can assign to any team
- ❌ Kanban board is READ-ONLY (cannot drag cards)

#### EquipmentList.jsx (Equipment Page)

**Managers**
- ✅ Can add new equipment
- ✅ Can delete equipment (scrap)
- ✅ Can view all equipment

**Technicians & Employees**
- ❌ Cannot add equipment
- ❌ Cannot delete equipment
- ✅ Can view all equipment

#### CalendarView.jsx (Calendar Page)

**Managers**
- ✅ Can create Preventive and Corrective requests
- ✅ Can click time slots to create events
- ✅ Can edit and delete events

**Technicians**
- ✅ Can create Corrective requests only
- ❌ Cannot create Preventive requests
- ⚠️ Auto-assigned to themselves
- ✅ Can click time slots to create events

**Employees**
- ❌ Calendar is READ-ONLY
- ❌ Cannot click time slots to create events
- ❌ Cannot edit or delete events

### Backend Route Protection

#### Equipment Routes (`/api/equipment`)
- **POST /equipment**: `requireRole('manager')` - Only managers can create equipment
- **PATCH /equipment/:id**: `requireRole('manager')` - Only managers can update equipment
- **DELETE /equipment/:id**: `requireRole('manager')` - Only managers can delete equipment

#### Teams Routes (`/api/teams`)
- **POST /teams**: `requireRole('manager')` - Only managers can create teams

#### Requests Routes (`/api/requests`)
- **POST /requests**: Custom logic based on request type
- **PATCH /requests/:id/status**: `requireRole(['manager', 'technician'])` - Employees cannot change status

## API Overview

### Authentication
- `POST /auth/signup` – Create a new user with Employee ID validation
- `POST /auth/login` – Authenticate user
- `GET /auth/me` – Retrieve current user (authenticated)

### Equipment
- `GET /equipment` – List all equipment
- `GET /equipment/:id` – Get equipment details
- `POST /equipment` – Create equipment (Manager only)
- `PATCH /equipment/:id` – Update equipment (Manager only)
- `DELETE /equipment/:id` – Delete equipment (Manager only)

### Teams
- `GET /teams` – List maintenance teams
- `GET /teams/:id` – Get team details
- `POST /teams` – Create team (Manager only)

### Users
- `GET /users` – List all users (Manager only)
- `GET /users/:id` – Get user details
- `PATCH /users/:id` – Update user (Manager only)
- `DELETE /users/:id` – Delete user (Manager only)

### Maintenance Requests (Core)
- `GET /requests` – List requests (supports filters by status, equipment, type)
- `GET /requests/:id` – Request details
- `POST /requests` – Create request (role-based restrictions)
- `PATCH /requests/:id/status` – Update request status (kanban)
- `PATCH /requests/:id` – Edit or reschedule request
- `DELETE /requests/:id` – Delete request
- `GET /requests/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD` – Calendar data
- `GET /requests/stats/summary` – Dashboard statistics

## Key Functional Areas

### Weekly Maintenance Calendar
The calendar provides a time‑based view of preventive maintenance operations.

**Features:**
- Weekly view (Sunday to Saturday)
- Hour-by-hour grid
- Click empty slots to create preventive requests (role-based)
- Edit or delete existing events (role-based)
- Drag-and-drop rescheduling
- Overlap handling for concurrent tasks
- Status‑based visual differentiation
- Current time indicator
- Week navigation controls
- Automatic refresh via polling (10‑second interval)

### Kanban Board
Four lifecycle stages: New, In Progress, Repaired, Scrap

**Features:**
- Drag-and-drop status transitions (role-based)
- Visual indicators for request type and assignment
- Shared data model with calendar and dashboard
- Role-based editing permissions

### Dashboard
Summary statistics derived from maintenance requests with quick access to key workflows.

**Features:**
- Automatic refresh via polling
- Role-based action availability

## Authentication & Security

All protected API endpoints require a JWT token provided via the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are stored client-side and attached automatically to authenticated requests. The system implements comprehensive RBAC with frontend UI restrictions and backend API enforcement.

### Signup Validation
- Employee ID: Exactly 6 numeric digits (unique)
- Password: Minimum 8 characters with at least 1 letter and 1 number
- Email: Unique across all users
- Default role: 'employee'

## MVP Scope

### Included
- ✅ User authentication with Employee ID validation
- ✅ Role-Based Access Control (RBAC)
- ✅ Equipment management with role restrictions
- ✅ Maintenance request workflows
- ✅ Weekly calendar view
- ✅ Kanban board with drag-and-drop
- ✅ User management system
- ✅ Team management
- ✅ Dashboard with statistics

### Explicitly Out of Scope
- ❌ Fine-grained role permissions
- ❌ Notifications
- ❌ File uploads
- ❌ External system integrations
- ❌ Advanced analytics and reporting

## Development Notes

### Backend
- ES module syntax
- Comprehensive migration system (`migrate-complete.js`)
- JWT authentication with RBAC middleware
- Polling-based synchronization (no WebSockets)
- PostgreSQL with automatic schema management

### Frontend
- Vite-based build pipeline
- Optimistic UI updates
- Shared layout with role-based navigation
- Client-side validation with server-side enforcement

### Database
- PostgreSQL with automatic migrations
- Comprehensive indexing for performance
- Foreign key constraints for data integrity
- CASCADE DELETE for equipment → requests relationship

## Third-Party Dependency Policy

No external SaaS APIs, authentication providers, or realtime messaging services. Fully self-hosted architecture using only:

- PostgreSQL (database)
- Node.js + Express (backend)
- React (frontend)

## Deployment

### Backend
```bash
# Set production environment
NODE_ENV=production
# Configure production DATABASE_URL
# Set secure JWT_SECRET
npm start
```

### Frontend
```bash
# Build assets
npm run build
# Serve the generated dist/ directory using any static file server
```

## License

MIT

GearGuard is designed as a focused, enterprise‑style maintenance planner that emphasizes clarity, reliability, and operational usability while remaining fully self‑contained and easy to evaluate.
