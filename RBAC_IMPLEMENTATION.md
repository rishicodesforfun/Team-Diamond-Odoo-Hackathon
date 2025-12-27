# Role-Based Access Control (RBAC) Implementation

## Overview
This document outlines the role-based access control implementation for the GearGuard maintenance management system.

## Roles
- **Employee**: Basic user with limited permissions
- **Technician**: Maintenance worker with moderate permissions
- **Manager**: Full administrative access

---

## Frontend UI Restrictions

### Layout.jsx
- **Teams Navigation**: Only visible to Managers
- **User Role Display**: Shows user's role in the header subtitle

### RequestsKanban.jsx (Requests Page)

#### Managers (Full Access)
- ✅ Can create both Corrective and Preventive requests
- ✅ Can assign requests to any team
- ✅ Can drag-and-drop cards between columns
- ✅ Full access to all features

#### Technicians
- ✅ Can create Corrective requests only
- ❌ Cannot create Preventive requests
- ⚠️ Auto-assigned to themselves (team dropdown hidden)
- ✅ Can drag-and-drop cards between columns

#### Employees
- ✅ Can create Corrective requests only
- ❌ Cannot create Preventive requests
- ✅ Can assign to any team
- ❌ Kanban board is READ-ONLY (cannot drag cards)

### EquipmentList.jsx (Equipment Page)

#### Managers
- ✅ Can add new equipment
- ✅ Can delete equipment (scrap)
- ✅ Can view all equipment

#### Technicians & Employees
- ❌ Cannot add equipment
- ❌ Cannot delete equipment
- ✅ Can view all equipment

### EquipmentDetail.jsx (Equipment Detail Page)

#### Managers
- ✅ Can edit equipment details
- ✅ Full access

#### Technicians & Employees
- ❌ Cannot edit equipment
- ✅ Can view equipment details
- ✅ Can view related requests

### CalendarView.jsx (Calendar Page)

#### Managers
- ✅ Can create Preventive and Corrective requests
- ✅ Can click time slots to create events
- ✅ Can edit and delete events
- ✅ Can assign to any team

#### Technicians
- ✅ Can create Corrective requests only
- ❌ Cannot create Preventive requests
- ⚠️ Auto-assigned to themselves
- ✅ Can click time slots to create events
- ✅ Can edit events

#### Employees
- ❌ Calendar is READ-ONLY
- ❌ Cannot click time slots to create events
- ❌ Cannot edit or delete events
- ℹ️ Message displayed: "Employees have read-only access. Create corrective requests from the Requests page."

---

## Backend Middleware

### authenticateToken
- Verifies JWT tokens
- Extracts user role from token
- Sets `req.user` with user info including role

### requireRole(allowedRoles)
- Accepts single role or array of roles
- Returns 403 Forbidden if user lacks required role
- Usage example:
  ```javascript
  router.post('/equipment', authenticateToken, requireRole('manager'), createEquipment);
  router.post('/maintenance', authenticateToken, requireRole(['technician', 'manager']), createMaintenance);
  ```

---

## Backend Route Protection

### Equipment Routes (`/api/equipment`)
- **POST /equipment**: `requireRole('manager')` - Only managers can create equipment
- **PATCH /equipment/:id**: `requireRole('manager')` - Only managers can update equipment
- **DELETE /equipment/:id**: `requireRole('manager')` - Only managers can delete (scrap) equipment
- **GET /equipment**: All authenticated users
- **GET /equipment/:id**: All authenticated users

### Teams Routes (`/api/teams`)
- **POST /teams**: `requireRole('manager')` - Only managers can create teams
- **GET /teams**: All authenticated users
- **GET /teams/:id**: All authenticated users

### Requests Routes (`/api/requests`)
- **POST /requests**: Custom logic
  - If `type === 'preventive'`: Only managers (403 for others)
  - If `type === 'corrective'`: All authenticated users
- **PATCH /requests/:id/status**: `requireRole(['manager', 'technician'])` - Employees cannot change status
- **PATCH /requests/:id**: All authenticated users (for editing details)
- **GET /requests**: All authenticated users
- **GET /requests/:id**: All authenticated users

---

## Database Schema

### users table
```sql
ALTER TABLE users 
ADD COLUMN role VARCHAR(50) 
DEFAULT 'employee' 
CHECK (role IN ('employee', 'technician', 'manager'));
```

---

## Auth Flow

### Signup
- Default role: 'employee'
- JWT includes: userId, email, role
- Response includes user object with role

### Login
- JWT includes: userId, email, role
- Response includes user object with role
- Frontend stores user in localStorage

---

## Testing Checklist

### As Employee
- [ ] Can only see Dashboard, Calendar, Requests, Equipment (no Teams)
- [ ] Can create Corrective requests only
- [ ] Cannot drag Kanban cards
- [ ] Cannot click calendar time slots
- [ ] Cannot add/edit/delete equipment
- [ ] Can view equipment details

### As Technician
- [ ] Can see all navigation items except Teams
- [ ] Can create Corrective requests only
- [ ] Auto-assigned to own requests
- [ ] Can drag Kanban cards
- [ ] Can create events from calendar
- [ ] Cannot add/edit/delete equipment
- [ ] Can view equipment details

### As Manager
- [ ] Can see all navigation items including Teams
- [ ] Can create both Corrective and Preventive requests
- [ ] Can assign to any team
- [ ] Can drag Kanban cards
- [ ] Full calendar access
- [ ] Can add/edit/delete equipment
- [ ] Full access to all features

---

## Implementation Notes

1. User role is stored in localStorage after login/signup
2. All components read user from localStorage on mount
3. UI elements are conditionally rendered based on `user?.role`
4. Backend middleware enforces role restrictions at API level
5. Frontend restrictions are for UX only - backend validation is required for security
