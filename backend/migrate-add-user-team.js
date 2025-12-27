import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addUserTeamColumn() {
  const client = await pool.connect();
  
  try {
    console.log('Checking if team_id column exists in users table...');
    
    // Check if column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'team_id'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✓ team_id column already exists');
    } else {
      console.log('Adding team_id column to users table...');
      
      // Add team_id column to users table
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN team_id INTEGER 
        REFERENCES teams(id) ON DELETE SET NULL
      `);
      
      console.log('✓ team_id column added successfully');
    }
    
    console.log('✓ Users can now be assigned to teams');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addUserTeamColumn()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
