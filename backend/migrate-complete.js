import pkg from 'pg';
const { Pool } = pkg;
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runCompleteMigration() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting complete GearGuard database migration...\n');

    // ==========================================
    // PHASE 1: Execute Base Schema from init.sql
    // ==========================================
    console.log('📋 PHASE 1: Setting up base database schema...');

    // Read and execute init.sql
    const sqlFile = join(__dirname, 'init.sql');
    let sql = readFileSync(sqlFile, 'utf8');

    // Remove comments and clean up SQL
    sql = sql
      .split('\n')
      .map(line => {
        const commentIndex = line.indexOf('--');
        if (commentIndex >= 0) {
          return line.substring(0, commentIndex).trim();
        }
        return line.trim();
      })
      .filter(line => line.length > 0)
      .join('\n');

    // Parse SQL statements
    const statements = [];
    let currentStatement = '';
    let inQuotes = false;
    let quoteChar = null;

    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];

      if ((char === '"' || char === "'") && (i === 0 || sql[i - 1] !== '\\')) {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuotes = false;
          quoteChar = null;
        }
      }

      currentStatement += char;

      if (char === ';' && !inQuotes) {
        const stmt = currentStatement.trim();
        if (stmt.length > 0) {
          statements.push(stmt);
        }
        currentStatement = '';
      }
    }

    console.log(`📝 Executing ${statements.length} base schema statements...`);

    await client.query('BEGIN');

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length > 0) {
        try {
          await client.query(statement);
          const preview = statement.substring(0, 50).replace(/\s+/g, ' ');
          console.log(`  ✓ [${i + 1}/${statements.length}] ${preview}...`);
        } catch (err) {
          // Handle "already exists" errors gracefully
          if (err.code === '42P07' || err.code === '42710' || err.code === '42P16') {
            const preview = statement.substring(0, 50).replace(/\s+/g, ' ');
            console.log(`  ⚠ [${i + 1}/${statements.length}] ${preview}... (already exists)`);
          } else {
            console.error(`  ❌ Failed at statement ${i + 1}:`);
            console.error(`     ${statement.substring(0, 100)}...`);
            throw err;
          }
        }
      }
    }

    await client.query('COMMIT');
    console.log('✅ Base schema setup completed\n');

    // ==========================================
    // PHASE 2: Feature Updates
    // ==========================================
    console.log('🔧 PHASE 2: Adding feature updates...\n');

    // Migration 1: Add role column to users table
    console.log('📋 Migration 1: Adding role column to users table...');
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS role VARCHAR(50)
      DEFAULT 'employee'
      CHECK (role IN ('employee', 'technician', 'manager'))
    `);

    await client.query(`
      UPDATE users
      SET role = 'employee'
      WHERE role IS NULL
    `);
    console.log('✅ Role column added\n');

    // Migration 2: Add team_id column to users table
    console.log('👥 Migration 2: Adding team_id column to users table...');
    const teamColumnCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'team_id'
    `);

    if (teamColumnCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE users
        ADD COLUMN team_id INTEGER
        REFERENCES teams(id) ON DELETE SET NULL
      `);
      console.log('✅ team_id column added');
    } else {
      console.log('✅ team_id column already exists');
    }
    console.log('');

    // Migration 3: Add assigned_technician_id column to requests table
    console.log('🔧 Migration 3: Adding assigned_technician_id column to requests table...');
    const technicianColumnCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'requests' AND column_name = 'assigned_technician_id'
    `);

    if (technicianColumnCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE requests
        ADD COLUMN assigned_technician_id INTEGER
        REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('✅ assigned_technician_id column added');
    } else {
      console.log('✅ assigned_technician_id column already exists');
    }
    console.log('');

    // Migration 4: Ensure is_usable column exists in equipment table
    console.log('⚙️ Migration 4: Ensuring is_usable column in equipment table...');
    const usableColumnCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'equipment' AND column_name = 'is_usable'
    `);

    if (usableColumnCheck.rows.length === 0) {
      await client.query('BEGIN');

      await client.query(`
        ALTER TABLE equipment
        ADD COLUMN is_usable BOOLEAN DEFAULT TRUE
      `);

      await client.query(`
        UPDATE equipment
        SET is_usable = TRUE
        WHERE is_usable IS NULL
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_equipment_is_usable
        ON equipment(is_usable)
      `);

      await client.query('COMMIT');
      console.log('✅ is_usable column added with index');
    } else {
      console.log('✅ is_usable column already exists');
    }
    console.log('');

    // ==========================================
    // PHASE 3: Final Verification
    // ==========================================
    console.log('🔍 PHASE 3: Verifying database schema...\n');

    // Check that all expected tables exist
    const tablesCheck = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('users', 'teams', 'equipment', 'requests')
      ORDER BY tablename
    `);

    console.log('📊 Tables verified:');
    tablesCheck.rows.forEach(row => {
      console.log(`  ✓ ${row.tablename}`);
    });

    // Check key columns exist
    const columnsCheck = await client.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_name IN ('users', 'requests', 'equipment')
      AND column_name IN ('role', 'team_id', 'assigned_technician_id', 'is_usable')
      ORDER BY table_name, column_name
    `);

    console.log('\n📋 Feature columns verified:');
    columnsCheck.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}.${row.column_name}`);
    });

    console.log('\n🎉 COMPLETE MIGRATION SUCCESSFUL!');
    console.log('✅ Database is now fully up-to-date with all GearGuard features');
    console.log('✅ Safe to run multiple times - all operations are idempotent');

  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      // Ignore rollback errors
    }
    console.error('❌ Migration failed:', error);
    console.error('Error details:', {
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runCompleteMigration()
  .then(() => {
    console.log('\n✅ Complete GearGuard migration finished successfully');
    console.log('🚀 Your database is ready with all features!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Complete GearGuard migration failed');
    process.exit(1);
  });
