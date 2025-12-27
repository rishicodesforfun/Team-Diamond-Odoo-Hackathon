# Database Migration Fix - Adding `is_usable` Column

## Problem
The database was initialized before the `is_usable` column was added to the `equipment` table. This causes "Internal Server Error" when:
- Creating maintenance requests
- Moving cards to "Scrap" status (Scrap Logic tries to update `is_usable`)

## Solution

### Step 1: Run SQL Migration

Execute the SQL migration to add the missing column:

**Option A: Using Node.js (Recommended - Easiest):**
```bash
npm run migrate:add-is-usable
```

This uses your existing database connection from `.env` and handles everything automatically.

**Option B: Using psql command line:**
```bash
psql -U postgres -d gearguard -f add_is_usable_column.sql
```

**Option C: Using psql interactive:**
```bash
psql -U postgres -d gearguard
```
Then paste and run:
```sql
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'equipment' AND column_name = 'is_usable'
  ) THEN
    ALTER TABLE equipment ADD COLUMN is_usable BOOLEAN DEFAULT TRUE;
    UPDATE equipment SET is_usable = TRUE WHERE is_usable IS NULL;
    CREATE INDEX IF NOT EXISTS idx_equipment_is_usable ON equipment(is_usable);
    RAISE NOTICE 'Column is_usable added successfully';
  ELSE
    RAISE NOTICE 'Column is_usable already exists';
  END IF;
END $$;
```

**Option C: Using Node.js (if you have a connection script):**
```bash
node -e "
import('pg').then(({default: pg}) => {
  const pool = new pg.Pool({connectionString: process.env.DATABASE_URL});
  const fs = require('fs');
  const sql = fs.readFileSync('add_is_usable_column.sql', 'utf8');
  pool.query(sql).then(() => {
    console.log('✅ Migration completed');
    process.exit(0);
  });
});
"
```

### Step 2: Verify the Column Exists

Check that the column was added:
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'equipment' AND column_name = 'is_usable';
```

You should see:
```
 column_name | data_type | column_default
-------------+-----------+----------------
 is_usable   | boolean   | true
```

## What Was Fixed

### 1. ✅ SQL Migration File
- Created `add_is_usable_column.sql` - Safe migration that checks if column exists before adding

### 2. ✅ Code Synchronization
- `backend/src/index.js` already includes `is_usable` in the CREATE TABLE statement (line 76)
- Migration logic in `runMigrations()` already adds the column if missing (lines 82-92)
- **No changes needed** - the code is already correct for future installs

### 3. ✅ Error Handling Improvements
- **POST /requests** - Now logs detailed error information:
  - Error message, code, detail, hint, and stack trace
  - Shows in development mode for debugging
  
- **PATCH /requests/:id/status** - Enhanced error handling:
  - Detailed logging for Scrap Logic failures
  - Separate try-catch for scrap logic so request status update still succeeds
  - Full error details logged to console
  
- **PATCH /requests/:id** - Same improvements as status endpoint

### 4. ✅ Equipment Route Verification
- **GET /equipment/:id** - Already returns `is_usable` via `SELECT e.*`
- Added fallback to default `true` if column doesn't exist (backward compatibility)
- Improved error logging

## Testing

After running the migration, test:

1. **Create a maintenance request:**
   ```bash
   curl -X POST http://localhost:3001/requests \
     -H "Content-Type: application/json" \
     -d '{
       "equipment_id": 1,
       "type": "corrective",
       "title": "Test Request"
     }'
   ```

2. **Move a request to Scrap:**
   ```bash
   curl -X PATCH http://localhost:3001/requests/1/status \
     -H "Content-Type: application/json" \
     -d '{"status": "scrap"}'
   ```

3. **Verify equipment is marked unusable:**
   ```sql
   SELECT id, name, is_usable FROM equipment WHERE id = 1;
   ```
   Should show `is_usable = false`

## Error Logging

All errors now log detailed information to the console:
- Error message
- PostgreSQL error code
- Detail and hint (if available)
- Stack trace
- Relevant context (request ID, equipment ID, etc.)

Check your terminal/console when errors occur to see the full details.

