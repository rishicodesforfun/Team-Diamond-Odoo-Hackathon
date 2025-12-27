import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addAssignedTechnicianColumn() {
  const client = await pool.connect();
  
  try {
    console.log('Checking if assigned_technician_id column exists in requests table...');
    
    // Check if column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'requests' AND column_name = 'assigned_technician_id'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✓ assigned_technician_id column already exists');
    } else {
      console.log('Adding assigned_technician_id column to requests table...');
      
      // Add assigned_technician_id column to requests table
      await client.query(`
        ALTER TABLE requests 
        ADD COLUMN assigned_technician_id INTEGER 
        REFERENCES users(id) ON DELETE SET NULL
      `);
      
      console.log('✓ assigned_technician_id column added successfully');
    }
    
    console.log('✓ Requests can now track which technician is assigned');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addAssignedTechnicianColumn()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
