-- Run this SQL directly in MySQL Workbench, phpMyAdmin, or MySQL CLI
-- Database: clinic_booking

USE clinic_booking;

-- Create appointment_otp table for OTP verification
CREATE TABLE IF NOT EXISTS appointment_otp (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  expires_at DATETIME NOT NULL,
  verified_at DATETIME,
  attempts INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  INDEX idx_appointment_id (appointment_id),
  INDEX idx_expires_at (expires_at)
);

-- Verify table was created
SHOW TABLES LIKE 'appointment_otp';

-- Check table structure
DESCRIBE appointment_otp;

-- Done! ✅
SELECT 'appointment_otp table created successfully!' as status;



