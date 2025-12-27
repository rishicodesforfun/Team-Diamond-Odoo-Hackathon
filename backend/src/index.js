import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db/connection.js';
import authRoutes from './auth/routes.js';
import equipmentRoutes from './equipment/routes.js';
import teamsRoutes from './teams/routes.js';
import requestsRoutes from './requests/routes.js';

console.log('📝 About to import users routes...');
import usersRoutes from './users/routes.js';
console.log('✅ Users routes imported successfully');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/equipment', equipmentRoutes);
app.use('/teams', teamsRoutes);
app.use('/requests', requestsRoutes);

console.log('📝 Registering /users routes...');
app.use('/users', usersRoutes);
console.log('✅ /users routes registered');

// Initialize database
async function initDB() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');

    // Run migrations
    await runMigrations();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Teams table
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Equipment table
    await client.query(`
      CREATE TABLE IF NOT EXISTS equipment (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        location VARCHAR(255),
        maintenance_team_id INTEGER REFERENCES teams(id),
        is_usable BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add is_usable column if it doesn't exist (for existing databases)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'equipment' AND column_name = 'is_usable'
        ) THEN
          ALTER TABLE equipment ADD COLUMN is_usable BOOLEAN DEFAULT TRUE;
        END IF;
      END $$;
    `);

    // Requests table (CORE)
    await client.query(`
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
      )
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
      CREATE INDEX IF NOT EXISTS idx_requests_scheduled_date ON requests(scheduled_date);
      CREATE INDEX IF NOT EXISTS idx_requests_equipment_id ON requests(equipment_id);
      CREATE INDEX IF NOT EXISTS idx_equipment_is_usable ON equipment(is_usable);
    `);

    // Seed default user for mock authentication (ID = 1)
    const userCheck = await client.query('SELECT id FROM users WHERE id = 1');
    if (userCheck.rows.length === 0) {
      // Check if any users exist - if not, we'll need to set the sequence
      const anyUserCheck = await client.query('SELECT COUNT(*) as count FROM users');
      const userCount = parseInt(anyUserCheck.rows[0].count);

      if (userCount === 0) {
        // No users exist, insert with explicit ID 1 and set sequence to 2
        await client.query(`
          INSERT INTO users (id, email, password_hash, name)
          VALUES (1, 'demo@gearguard.com', '$2a$10$dummy.hash.for.mock.auth', 'Demo User')
        `);
        await client.query(`SELECT setval('users_id_seq', 3, false)`);
        console.log('✅ Created default demo user (ID: 1)');
      } else {
        // Users exist but ID 1 doesn't - try to insert with explicit ID
        // This might fail if sequence is ahead, so we'll handle it
        try {
          await client.query(`
            INSERT INTO users (id, email, password_hash, name)
            VALUES (1, 'demo@gearguard.com', '$2a$10$dummy.hash.for.mock.auth', 'Demo User')
          `);
          console.log('✅ Created default demo user (ID: 1)');
        } catch (insertError) {
          // If insert fails, we'll use the first available user ID
          const firstUser = await client.query('SELECT id FROM users ORDER BY id LIMIT 1');
          if (firstUser.rows.length > 0) {
            console.log(`⚠️  Could not create user with ID 1. Using existing user ID: ${firstUser.rows[0].id}`);
          }
        }
      }
    }

    await client.query('COMMIT');
    console.log('✅ Database migrations completed');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await initDB();
});

