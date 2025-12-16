-- Fix patients table to allow NULL user_id for walk-in patients
-- Run this script if you get errors creating patients without user_id

-- Check current schema
SHOW CREATE TABLE patients;

-- Make user_id nullable (if it's NOT NULL)
ALTER TABLE patients MODIFY COLUMN user_id INT NULL;

-- Verify the change
DESCRIBE patients;





