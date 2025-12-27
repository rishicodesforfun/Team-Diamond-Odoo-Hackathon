import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addRoleColumn() {
  const client = await pool.connect();
  
  try {
    console.log('Adding role column to users table...');
    
    // Add role column with default 'employee'
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role VARCHAR(50) 
      DEFAULT 'employee' 
      CHECK (role IN ('employee', 'technician', 'manager'))
    `);
    
    // Update existing users to have 'employee' role if NULL
    await client.query(`
      UPDATE users 
      SET role = 'employee' 
      WHERE role IS NULL
    `);
    
    console.log('✓ Role column added successfully');
    console.log('✓ Existing users set to "employee" role');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addRoleColumn()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
