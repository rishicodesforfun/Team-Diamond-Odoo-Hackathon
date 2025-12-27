# Quick Setup Guide

## 1. Database Setup

```bash
# Create PostgreSQL database
createdb gearguard

# Or using psql:
psql -U postgres
CREATE DATABASE gearguard;
\q
```

## 2. Backend Setup

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

## 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## 4. Access the App

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 5. First Steps

1. Sign up for a new account
2. Create a team (Teams page)
3. Add equipment (Equipment page)
4. Create a maintenance request (Calendar or Requests page)
5. View in Kanban board (Requests page)

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Check DATABASE_URL in backend/.env
- Verify database exists: `psql -l | grep gearguard`

### Port Already in Use
- Change PORT in backend/.env
- Update frontend/vite.config.js proxy target

### CORS Issues
- Backend CORS is configured for localhost:3000
- If using different port, update backend/src/index.js CORS settings

