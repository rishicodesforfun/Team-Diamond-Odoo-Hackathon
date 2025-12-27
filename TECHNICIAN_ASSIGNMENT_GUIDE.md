# Technician Assignment Implementation Guide

## Setup Steps

### 1. Run Migration
```bash
cd backend
node migrate-add-assigned-technician.js
```

This adds `assigned_technician_id` column to the `requests` table.

### 2. Update GET /requests Route

In `backend/src/requests/routes.js`, update the GET / route query to:

```javascript
// Get all requests (with filters)
router.get('/', async (req, res) => {
  try {
    const { status, equipment_id, type } = req.query;
    let query = `
      SELECT r.*, 
             e.name as equipment_name, 
             e.category as equipment_category,
             t.name as team_name,
             u.name as user_name,
             tech.name as assigned_technician_name
      FROM requests r
      LEFT JOIN equipment e ON r.equipment_id = e.id
      LEFT JOIN teams t ON r.team_id = t.id
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN users tech ON r.assigned_technician_id = tech.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // RBAC: Technicians can only see requests for their team
    if (req.user.role === 'technician' && req.user.team_id) {
      query += ` AND r.team_id = $${paramCount++}`;
      params.push(req.user.team_id);
    }

    if (status) {
      query += ` AND r.status = $${paramCount++}`;
      params.push(status);
    }
    if (equipment_id) {
      query += ` AND r.equipment_id = $${paramCount++}`;
      params.push(equipment_id);
    }
    if (type) {
      query += ` AND r.type = $${paramCount++}`;
      params.push(type);
    }

    query += ' ORDER BY r.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 3. Restart Backend
```bash
npm start
```

## Features Implemented

### Backend

#### 1. Team-Based Filtering
- Technicians only see requests assigned to their team
- Managers and employees see all requests

#### 2. Technician Assignment Route
- **PATCH /requests/:id/assign-technician**
- Body: `{ "technician_id": 123 }`
- Technicians can only assign themselves
- Managers can assign any technician

#### 3. Middleware Enhancement
- `authenticateToken` now fetches and includes `team_id` in `req.user`
- This enables team-based filtering

### Frontend Updates Needed

#### 1. RequestsKanban.jsx
Add "Assign to Me" button for technicians:

```javascript
{user?.role === 'technician' && !request.assigned_technician_id && (
  <button 
    onClick={() => handleAssignToMe(request.id)}
    className="btn-assign-me"
  >
    Assign to Me
  </button>
)}

{request.assigned_technician_name && (
  <div className="assigned-tech">
    Assigned to: {request.assigned_technician_name}
  </div>
)}
```

Add handler:
```javascript
const handleAssignToMe = async (requestId) => {
  try {
    await api.patch(`/requests/${requestId}/assign-technician`, {
      technician_id: user.id
    });
    loadData(); // Refresh
  } catch (error) {
    alert(error.response?.data?.error || 'Failed to assign');
  }
};
```

#### 2. CalendarView.jsx
Same updates as RequestsKanban.jsx

## Workflow

### As Manager:
1. Navigate to Users page
2. Assign technicians to teams
3. Technicians can now see only their team's requests

### As Technician:
1. Login (already assigned to a team by manager)
2. See only requests for your team
3. Click "Assign to Me" on any request
4. Request shows "Assigned to: Your Name"
5. Other technicians in the same team can see who picked it up

### As Employee:
1. Create corrective requests
2. Assign to any team
3. Technicians in that team will see it

## Database Schema

### requests table (updated)
```sql
ALTER TABLE requests 
ADD COLUMN assigned_technician_id INTEGER 
REFERENCES users(id) ON DELETE SET NULL;
```

### users table (already updated)
```sql
ALTER TABLE users 
ADD COLUMN team_id INTEGER 
REFERENCES teams(id) ON DELETE SET NULL;
```

## API Endpoints

### GET /requests
- Filters by team for technicians
- Returns `assigned_technician_name` field

### PATCH /requests/:id/assign-technician
- Assigns a technician to a request
- Body: `{ "technician_id": 123 }`
- Technicians can only assign themselves

## Testing

### Test as Manager:
1. Assign a technician to a team
2. Create a request for that team
3. Login as that technician
4. Verify they see only their team's requests

### Test as Technician:
1. Login as technician (assigned to a team)
2. See only your team's requests
3. Click "Assign to Me" on a request
4. Verify it shows "Assigned to: Your Name"
5. Verify other technicians in your team can see the assignment

### Test as Employee:
1. Create a corrective request
2. Assign it to a specific team
3. Login as technician in that team
4. Verify they see the request

## Benefits

✅ **Team-Based Visibility**: Technicians only see relevant requests
✅ **Clear Ownership**: Track which technician is working on what
✅ **Self-Assignment**: Technicians can pick up requests themselves
✅ **Transparency**: Everyone can see who's assigned to each request
✅ **Workload Distribution**: Managers can see which technicians are busy

## Next Steps

1. Run the migration
2. Update the GET /requests route (see step 2 above)
3. Restart backend
4. Add frontend UI for "Assign to Me" button
5. Test the workflow
