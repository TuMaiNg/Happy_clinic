-- Migration: Fix patients table to allow NULL user_id for walk-in patients
-- This allows staff/admin to create patients without requiring a user account

USE clinic_booking;

-- Check current schema
SELECT 
    COLUMN_NAME,
    IS_NULLABLE,
    COLUMN_TYPE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'clinic_booking'
  AND TABLE_NAME = 'patients'
  AND COLUMN_NAME = 'user_id';

-- Make user_id nullable (if it's NOT NULL)
ALTER TABLE patients MODIFY COLUMN user_id INT NULL;

-- Verify the change
SELECT 
    COLUMN_NAME,
    IS_NULLABLE,
    COLUMN_TYPE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'clinic_booking'
  AND TABLE_NAME = 'patients'
  AND COLUMN_NAME = 'user_id';

-- Success message
SELECT 'Migration completed: user_id is now nullable' AS status;







