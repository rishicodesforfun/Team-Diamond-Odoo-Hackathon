import { pool } from './src/db/connection.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function createLoginUser() {
  const client = await pool.connect();
  try {
    console.log('🔄 Creating login user...');
    
    const email = 'demo@gearguard.com';
    const password = 'demo123'; // Easy password for development
    const name = 'Demo User';
    
    // Check if user already exists
    const existingUser = await client.query('SELECT id, email FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      console.log('✅ User already exists with email:', email);
      console.log('📝 To reset password, delete the user first or update manually');
      return;
    }

    await client.query('BEGIN');

    // Hash password properly
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if any users exist to determine if we should use ID 1
    const anyUserCheck = await client.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(anyUserCheck.rows[0].count);
    
    if (userCount === 0) {
      // No users exist, set sequence to start at 1 and insert
      await client.query(`SELECT setval('users_id_seq', 1, false)`);
      await client.query(`
        INSERT INTO users (id, email, password_hash, name)
        VALUES (1, $1, $2, $3)
      `, [email, passwordHash, name]);
      console.log('✅ Created login user (ID: 1)');
    } else {
      // Users exist, let it auto-increment
      const result = await client.query(`
        INSERT INTO users (email, password_hash, name)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [email, passwordHash, name]);
      console.log(`✅ Created login user (ID: ${result.rows[0].id})`);
    }

    await client.query('COMMIT');
    console.log('✅ Login user created successfully');
    console.log('\n📋 Login Credentials:');
    console.log('   Email: demo@gearguard.com');
    console.log('   Password: demo123');
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      // Ignore rollback errors
    }
    console.error('❌ Failed to create login user:', error.message);
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

createLoginUser()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed');
    process.exit(1);
  });

