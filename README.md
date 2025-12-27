# GearGuard - Smart Maintenance Planner

A maintenance-first dashboard that lets teams track assets, schedule preventive maintenance visually, handle breakdowns quickly, and see everything in one unified timeline.

## 🎯 MVP Features

- ✅ **Authentication** - Signup/Login with JWT
- ✅ **Equipment Management** - Track assets (machines, vehicles)
- ✅ **Maintenance Requests** - Create corrective (breakdown) and preventive (scheduled) requests
- ✅ **Weekly Calendar View** - Visual planning with hour-by-hour scheduling
- ✅ **Kanban Board** - Drag-and-drop status management (New → In Progress → Repaired → Scrap)
- ✅ **Dashboard** - Summary statistics and quick actions
- ✅ **Teams** - Simple team management

## 🏗️ Architecture

### Backend (`backend/`)
- **Node.js + Express** - RESTful API
- **PostgreSQL** - Single database
- **JWT** - Authentication
- **Folder Structure:**
  - `auth/` - Signup, login, JWT middleware
  - `equipment/` - Asset management
  - `teams/` - Maintenance teams
  - `requests/` - Core business logic (Kanban + Calendar)
  - `db/` - Database connection

### Frontend (`frontend/`)
- **React + Vite** - Modern React app
- **React Router** - Client-side routing
- **Folder Structure:**
  - `auth/` - Login/Signup screens
  - `equipment/` - Asset list & detail view
  - `teams/` - Team list
  - `requests/` - Kanban board
  - `calendar/` - Weekly maintenance calendar (STAR FEATURE ⭐)
  - `api/` - All fetch wrappers

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### Backend Setup

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your database URL and JWT secret
```

3. **Create PostgreSQL database:**
```sql
CREATE DATABASE gearguard;
```

4. **Update `.env`:**
```
PORT=3001
DATABASE_URL=postgresql://localhost:5432/gearguard
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
```

5. **Start the server:**
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend will automatically create all tables on first run.

### Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Start the development server:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📡 API Endpoints

### Authentication
- `POST /auth/signup` - Create account
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user (requires auth)

### Equipment
- `GET /equipment` - List all equipment
- `GET /equipment/:id` - Get equipment details
- `POST /equipment` - Create equipment
- `PATCH /equipment/:id` - Update equipment
- `DELETE /equipment/:id` - Delete equipment

### Teams
- `GET /teams` - List all teams
- `GET /teams/:id` - Get team details
- `POST /teams` - Create team

### Requests (Core Feature)
- `GET /requests` - List requests (supports `?status=`, `?equipment_id=`, `?type=`)
- `GET /requests/:id` - Get request details
- `POST /requests` - Create request
- `PATCH /requests/:id/status` - Update status (for Kanban drag)
- `PATCH /requests/:id` - Update request (for editing and drag-and-drop rescheduling)
- `DELETE /requests/:id` - Delete request
- `GET /requests/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD` - Get calendar events
- `GET /requests/stats/summary` - Dashboard statistics

## 🎨 Key Features

### Calendar View (STAR FEATURE ⭐)
- Week view (Sunday-Saturday)
- Hour-by-hour grid (24-hour format)
- **Click empty slot** to create new maintenance request
- **Click existing event** to edit or delete
- **Drag-and-drop rescheduling** - Drag events to new time slots
- **Smart overlap handling** - Multiple events at same time display side-by-side
- Visual event blocks with status colors:
  - 🔵 New - Blue
  - 🟠 In Progress - Orange
  - 🟢 Repaired - Green
  - ⚫ Scrap - Gray
- Current time indicator (yellow highlight)
- Navigate weeks with Previous/Next/Today buttons
- Shows event title, time, and duration
- Auto-refreshes every 10 seconds

### Kanban Board
- Four columns: New, In Progress, Repaired, Scrap
- **Drag-and-drop** to change status
- Color-coded by request type (corrective/preventive)
- Shows equipment, team, and scheduled date
- Real-time status updates

### Dashboard
- Summary cards with statistics
- Quick action links
- Auto-refreshes every 10 seconds

## 🔐 Authentication

All API endpoints (except `/auth/signup` and `/auth/login`) require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

Tokens are stored in localStorage and automatically included in requests.

## 📊 Database Schema

- **users** - User accounts
- **teams** - Maintenance teams
- **equipment** - Assets (machines, vehicles)
- **requests** - Maintenance requests (core table)

## 🎯 MVP Scope (What's Included)

✅ **Included:**
- Login/Signup
- Asset management
- Maintenance request creation
- Weekly maintenance calendar
- Kanban board
- Role-agnostic (simple)

❌ **Out of Scope (Not Built):**
- Permissions matrix
- Notifications
- File uploads
- External integrations
- Complex analytics

## 🛠️ Development

### Backend
- Uses ES modules (`type: "module"`)
- Auto-creates database tables on startup
- Polling-based "realtime" (10-second intervals)

### Frontend
- Vite for fast development
- Proxy configured for API calls
- Optimistic UI updates
- Shared Layout component for consistent navigation

## 📝 Notes

- No third-party APIs used (pure PostgreSQL + Node.js + React)
- Simple polling instead of WebSockets
- Role-agnostic design (no complex permissions)
- Clean, enterprise-grade UI
- Easy to demo and explain

## 🚀 Deployment

### Backend
1. Set `NODE_ENV=production`
2. Update `DATABASE_URL` to production database
3. Set secure `JWT_SECRET`
4. Run: `npm start`

### Frontend
1. Build: `npm run build`
2. Serve `dist/` folder with any static file server
3. Configure API proxy or update API_URL in code

## 📄 License

MIT

---

**Built for Hackathon** - GearGuard combines assets, teams, and time into one unified maintenance workflow.

