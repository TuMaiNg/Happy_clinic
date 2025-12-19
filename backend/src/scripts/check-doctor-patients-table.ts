/**
 * Script to check if doctor_patients table exists and create it if needed
 */

import pool from '../config/database';

async function checkDoctorPatientsTable() {
  try {
    console.log('🔍 Đang kiểm tra bảng doctor_patients...');
    
    // Check if table exists
    const [tables] = await pool.query(
      `SELECT TABLE_NAME 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'doctor_patients'`
    ) as any[];
    
    if (tables.length > 0) {
      console.log('✅ Bảng doctor_patients đã tồn tại');
      
      // Check structure
      const [columns] = await pool.query(
        `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'doctor_patients'`
      ) as any[];
      
      console.log(`📋 Bảng có ${columns.length} cột:`);
      columns.forEach((col: any) => {
        console.log(`   - ${col.COLUMN_NAME} (${col.COLUMN_TYPE}, ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
    } else {
      console.log('⚠️  Bảng doctor_patients chưa tồn tại');
      console.log('📝 Vui lòng chạy migration:');
      console.log('   mysql -u root -p clinic_booking < backend/src/database/migrations/create_doctor_patients_table.sql');
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

checkDoctorPatientsTable();

