-- Remove OTP functionality
-- This migration removes the OTP table and related columns

-- Drop OTP table
DROP TABLE IF EXISTS appointment_otp;

-- Remove OTP-related columns from appointments table if they exist
ALTER TABLE appointments 
DROP COLUMN IF EXISTS otp_verified_at;

-- Note: The appointments table status column remains
-- New flow: pending -> confirmed (by staff) -> checked-in -> completed

