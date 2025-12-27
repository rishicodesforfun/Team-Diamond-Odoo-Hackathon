GearGuard – Smart Maintenance Planner
GearGuard is a maintenance‑first asset management system designed to help organizations efficiently track equipment, manage maintenance workflows, and plan preventive operations using a unified, time‑centric interface.

The system combines asset management, maintenance request workflows, kanban tracking, and a weekly maintenance calendar into a single, coherent platform suitable for operational teams and technical reviewers.

Overview
GearGuard focuses on three core dimensions of maintenance operations:

Assets – What needs to be maintained

Teams – Who is responsible for maintenance

Time – When maintenance is scheduled or performed

By unifying these dimensions, GearGuard enables teams to move away from fragmented tools and spreadsheets toward a structured, visual, and reliable maintenance workflow.

MVP Features
Authentication using JWT (Signup / Login)

Equipment and asset management (machines, vehicles, infrastructure)

Maintenance request handling:

Corrective (breakdown-driven)

Preventive (scheduled)

Weekly maintenance calendar with hour-level scheduling

Kanban board for request lifecycle management

Dashboard with summary statistics and quick actions

Basic maintenance team management

Role-agnostic design for simplicity and rapid onboarding

Architecture
Backend (backend/)
Node.js with Express (RESTful API)

PostgreSQL (single relational database)

JWT-based authentication

Modular, domain-driven folder structure

Backend Modules

auth/ – Authentication, JWT issuance, authorization middleware

equipment/ – Asset and equipment management

teams/ – Maintenance team definitions

requests/ – Core maintenance logic (calendar + kanban)

db/ – Database connection and schema initialization

Frontend (frontend/)
React with Vite for fast development

Client-side routing

Modular UI aligned with backend domains

Frontend Modules

auth/ – Login and signup views

equipment/ – Asset listing and detail views

teams/ – Team overview

requests/ – Kanban board

calendar/ – Weekly maintenance calendar

api/ – Centralized API request wrappers

Quick Start
Prerequisites
Node.js 18 or higher

PostgreSQL 12 or higher

npm or yarn

Backend Setup
Install dependencies:

cd backend
npm install
Configure environment variables:

cp .env.example .env
Create the PostgreSQL database:

CREATE DATABASE gearguard;
Update .env:

PORT=3001
DATABASE_URL=postgresql://localhost:5432/gearguard
JWT_SECRET=change-this-secret-in-production
NODE_ENV=development
Start the backend server:

npm start
For development with auto-reload:

npm run dev
The backend initializes required database tables automatically on first run.

Frontend Setup
Install dependencies:

cd frontend
npm install
Start the development server:

npm run dev
The frontend will be available at:

http://localhost:3000
API Overview
Authentication
POST /auth/signup – Create a new user

POST /auth/login – Authenticate user

GET /auth/me – Retrieve current user (authenticated)

Equipment
GET /equipment – List all equipment

GET /equipment/:id – Get equipment details

POST /equipment – Create equipment

PATCH /equipment/:id – Update equipment

DELETE /equipment/:id – Delete equipment

Teams
GET /teams – List maintenance teams

GET /teams/:id – Get team details

POST /teams – Create team

Maintenance Requests (Core)
GET /requests – List requests (supports filters by status, equipment, type)

GET /requests/:id – Request details

POST /requests – Create request

PATCH /requests/:id/status – Update request status (kanban)

PATCH /requests/:id – Edit or reschedule request

DELETE /requests/:id – Delete request

GET /requests/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD – Calendar data

GET /requests/stats/summary – Dashboard statistics

Key Functional Areas
Weekly Maintenance Calendar
The calendar provides a time‑based view of preventive maintenance operations.

Features:

Weekly view (Sunday to Saturday)

Hour-by-hour grid

Click empty slots to create preventive requests

Edit or delete existing events

Drag-and-drop rescheduling

Overlap handling for concurrent tasks

Status‑based visual differentiation

Current time indicator

Week navigation controls

Automatic refresh via polling (10‑second interval)

Kanban Board
Four lifecycle stages: New, In Progress, Repaired, Scrap

Drag-and-drop status transitions

Visual indicators for request type and assignment

Shared data model with calendar and dashboard

Dashboard
Summary statistics derived from maintenance requests

Quick access to key workflows

Automatic refresh via polling

Authentication & Security
All protected API endpoints require a JWT token provided via the Authorization header:

Authorization: Bearer <token>
Tokens are stored client-side and attached automatically to authenticated requests.

Database Schema (High-Level)
users – User accounts

teams – Maintenance teams

equipment – Assets and equipment

requests – Maintenance requests (core operational table)

MVP Scope
Included
User authentication

Equipment management

Maintenance request workflows

Weekly calendar view

Kanban board

Basic team management

Explicitly Out of Scope
Fine-grained role permissions

Notifications

File uploads

External system integrations

Advanced analytics and reporting

Development Notes
Backend
ES module syntax

Automatic schema initialization

Polling-based synchronization (no WebSockets)

Frontend
Vite-based build pipeline

Optimistic UI updates

Shared layout for consistent navigation

Third-Party Dependency Policy
No external SaaS APIs

No external authentication providers

No realtime messaging services

Fully self-hosted architecture

All functionality is implemented using:

PostgreSQL

Node.js

Express

React

Deployment
Backend
Set NODE_ENV=production

Configure production DATABASE_URL

Set a secure JWT_SECRET

Start server:

npm start
Frontend
Build assets:

npm run build
Serve the generated dist/ directory using any static file server

Configure API base URL as required

License
MIT

GearGuard is designed as a focused, enterprise‑style maintenance planner that emphasizes clarity, reliability, and operational usability while remaining fully self‑contained and easy to evaluate.
