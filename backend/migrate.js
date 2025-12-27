import { pool } from './src/db/connection.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('🔄 Starting database migrations...');
    
    // Read and execute init.sql
    const sqlFile = join(__dirname, 'init.sql');
    let sql = readFileSync(sqlFile, 'utf8');
    
    // Remove comments
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
    
    // Split into individual statements (more robust parsing)
    const statements = [];
    let currentStatement = '';
    let inQuotes = false;
    let quoteChar = null;
    
    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];
      const nextChar = sql[i + 1];
      
      // Track quoted strings
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
      
      // If we hit a semicolon outside of quotes, it's the end of a statement
      if (char === ';' && !inQuotes) {
        const stmt = currentStatement.trim();
        if (stmt.length > 0) {
          statements.push(stmt);
        }
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim().length > 0) {
      statements.push(currentStatement.trim());
    }

    console.log(`📝 Found ${statements.length} SQL statements to execute...`);
    
    await client.query('BEGIN');
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length > 0) {
        try {
          await client.query(statement);
          const preview = statement.substring(0, 50).replace(/\s+/g, ' ');
          console.log(`  ✓ [${i + 1}/${statements.length}] ${preview}...`);
        } catch (err) {
          // If it's a "already exists" error, that's okay (idempotent)
          if (err.code === '42P07' || err.code === '42710' || err.code === '42P16') {
            const preview = statement.substring(0, 50).replace(/\s+/g, ' ');
            console.log(`  ⚠ [${i + 1}/${statements.length}] ${preview}... (skipped - already exists)`);
          } else {
            console.error(`  ❌ Failed at statement ${i + 1}:`);
            console.error(`     ${statement.substring(0, 100)}...`);
            throw err;
          }
        }
      }
    }

    await client.query('COMMIT');
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      // Ignore rollback errors
    }
    console.error('❌ Migration failed:', error.message);
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

runMigrations()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });

