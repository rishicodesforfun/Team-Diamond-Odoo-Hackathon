-- Migration: Add is_usable column to equipment table
-- Run this SQL if your database was created before the is_usable column was added

-- Add is_usable column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'equipment' AND column_name = 'is_usable'
  ) THEN
    ALTER TABLE equipment ADD COLUMN is_usable BOOLEAN DEFAULT TRUE;
    -- Set all existing equipment as usable
    UPDATE equipment SET is_usable = TRUE WHERE is_usable IS NULL;
    -- Create index for performance
    CREATE INDEX IF NOT EXISTS idx_equipment_is_usable ON equipment(is_usable);
    RAISE NOTICE 'Column is_usable added successfully';
  ELSE
    RAISE NOTICE 'Column is_usable already exists';
  END IF;
END $$;

