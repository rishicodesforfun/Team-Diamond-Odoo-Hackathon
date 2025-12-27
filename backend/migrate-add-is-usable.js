import { pool } from './src/db/connection.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function addIsUsableColumn() {
  const client = await pool.connect();
  try {
    console.log('🔄 Adding is_usable column to equipment table...');
    
    // Check if column already exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'equipment' AND column_name = 'is_usable'
    `);

    if (checkResult.rows.length > 0) {
      console.log('✅ Column is_usable already exists. Skipping migration.');
      return;
    }

    await client.query('BEGIN');

    // Add the column
    await client.query(`
      ALTER TABLE equipment 
      ADD COLUMN is_usable BOOLEAN DEFAULT TRUE
    `);

    // Set all existing equipment as usable
    await client.query(`
      UPDATE equipment 
      SET is_usable = TRUE 
      WHERE is_usable IS NULL
    `);

    // Create index for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_equipment_is_usable 
      ON equipment(is_usable)
    `);

    await client.query('COMMIT');
    console.log('✅ Successfully added is_usable column to equipment table');
    console.log('✅ Created index idx_equipment_is_usable');
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      // Ignore rollback errors
    }
    console.error('❌ Migration failed:', error.message);
    console.error('   Error code:', error.code);
    if (error.detail) {
      console.error('   Detail:', error.detail);
    }
    if (error.hint) {
      console.error('   Hint:', error.hint);
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addIsUsableColumn()
  .then(() => {
    console.log('✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed');
    process.exit(1);
  });

