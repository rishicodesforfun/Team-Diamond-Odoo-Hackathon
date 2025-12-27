import { pool } from './src/db/connection.js';
import dotenv from 'dotenv';

dotenv.config();

async function seedDefaultUser() {
  const client = await pool.connect();
  try {
    console.log('🔄 Checking for default user...');
    
    // Check if user with ID 1 exists
    const userCheck = await client.query('SELECT id, email, name FROM users WHERE id = 1');
    
    if (userCheck.rows.length > 0) {
      console.log('✅ Default user (ID: 1) already exists:');
      console.log(`   Email: ${userCheck.rows[0].email}`);
      console.log(`   Name: ${userCheck.rows[0].name}`);
      return;
    }

    await client.query('BEGIN');

    // Check if any users exist
    const anyUserCheck = await client.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(anyUserCheck.rows[0].count);
    
    if (userCount === 0) {
      // No users exist, set sequence to start at 1 and insert
      await client.query(`SELECT setval('users_id_seq', 1, false)`);
      await client.query(`
        INSERT INTO users (id, email, password_hash, name)
        VALUES (1, 'demo@gearguard.com', '$2a$10$dummy.hash.for.mock.auth', 'Demo User')
      `);
      console.log('✅ Created default demo user (ID: 1)');
    } else {
      // Users exist but ID 1 doesn't - try to insert with explicit ID
      try {
        await client.query(`
          INSERT INTO users (id, email, password_hash, name)
          VALUES (1, 'demo@gearguard.com', '$2a$10$dummy.hash.for.mock.auth', 'Demo User')
        `);
        console.log('✅ Created default demo user (ID: 1)');
      } catch (insertError) {
        if (insertError.code === '23505') {
          // Unique constraint violation - user might have been created between checks
          console.log('✅ Default user already exists (created concurrently)');
        } else {
          throw insertError;
        }
      }
    }

    await client.query('COMMIT');
    console.log('✅ Default user seeded successfully');
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      // Ignore rollback errors
    }
    console.error('❌ Seed failed:', error.message);
    console.error('   Error code:', error.code);
    if (error.detail) {
      console.error('   Detail:', error.detail);
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDefaultUser()
  .then(() => {
    console.log('✅ Seed script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed');
    process.exit(1);
  });

