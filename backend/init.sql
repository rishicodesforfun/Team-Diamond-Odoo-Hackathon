-- GearGuard Database Schema
-- PostgreSQL initialization script

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  location VARCHAR(255),
  maintenance_team_id INTEGER REFERENCES teams(id),
  is_usable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Requests table (CORE)
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_scheduled_date ON requests(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_requests_equipment_id ON requests(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_is_usable ON equipment(is_usable);

