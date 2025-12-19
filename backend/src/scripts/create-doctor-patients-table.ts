/**
 * Script to create doctor_patients table
 */

import pool from '../config/database';

async function createDoctorPatientsTable() {
  try {
    console.log('🔧 Đang tạo bảng doctor_patients...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS doctor_patients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doctor_id INT NOT NULL,
        patient_id INT NOT NULL,
        status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
        notes TEXT NULL,
        accepted_at DATETIME NULL,
        rejected_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        UNIQUE KEY unique_doctor_patient (doctor_id, patient_id),
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        
        INDEX idx_doctor_id (doctor_id),
        INDEX idx_patient_id (patient_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Đã tạo bảng doctor_patients thành công!');
    
    // Verify
    const [tables] = await pool.query(
      `SELECT TABLE_NAME 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'doctor_patients'`
    ) as any[];
    
    if (tables.length > 0) {
      console.log('✅ Xác nhận: Bảng đã tồn tại');
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️  Bảng đã tồn tại, không cần tạo lại');
      process.exit(0);
    }
    process.exit(1);
  }
}

createDoctorPatientsTable();

