import pool from '../config/database';

async function checkDoctors() {
  try {
    console.log('🔍 Đang kiểm tra tài khoản bác sĩ trong database...\n');

    // Check users with doctor role
    const [users] = await pool.query(
      `SELECT id, email, role, status, created_at 
       FROM users 
       WHERE role = 'doctor'`
    ) as any[];

    console.log(`📊 Tổng số user có role 'doctor': ${users.length}\n`);

    if (users.length === 0) {
      console.log('❌ Không có tài khoản bác sĩ nào trong database!');
      console.log('💡 Bạn cần tạo tài khoản bác sĩ qua Admin panel hoặc API.\n');
    } else {
      console.log('✅ Danh sách tài khoản bác sĩ:\n');
      for (const user of users) {
        console.log(`  - ID: ${user.id}`);
        console.log(`    Email: ${user.email}`);
        console.log(`    Status: ${user.status}`);
        console.log(`    Created: ${user.created_at}`);
        console.log('');
      }

      // Check doctor records
      const [doctors] = await pool.query(
        `SELECT d.id, d.full_name, d.speciality, d.user_id, u.email
         FROM doctors d
         JOIN users u ON d.user_id = u.id
         ORDER BY d.id`
      ) as any[];

      console.log(`📋 Tổng số bản ghi trong bảng doctors: ${doctors.length}\n`);

      if (doctors.length === 0) {
        console.log('⚠️  Có user với role doctor nhưng không có bản ghi trong bảng doctors!');
        console.log('💡 Có thể cần tạo doctor record cho các user này.\n');
      } else {
        console.log('✅ Danh sách bác sĩ:\n');
        for (const doctor of doctors) {
          console.log(`  - ID: ${doctor.id}`);
          console.log(`    Tên: ${doctor.full_name}`);
          console.log(`    Chuyên khoa: ${doctor.speciality}`);
          console.log(`    Email: ${doctor.email}`);
          console.log(`    User ID: ${doctor.user_id}`);
          console.log('');
        }
      }

      // Check for orphaned records
      const [orphanedUsers] = await pool.query(
        `SELECT u.id, u.email
         FROM users u
         WHERE u.role = 'doctor'
         AND NOT EXISTS (
           SELECT 1 FROM doctors d WHERE d.user_id = u.id
         )`
      ) as any[];

      if (orphanedUsers.length > 0) {
        console.log('⚠️  Có user với role doctor nhưng không có doctor record:\n');
        for (const user of orphanedUsers) {
          console.log(`  - User ID: ${user.id}, Email: ${user.email}`);
        }
        console.log('');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra database:', error);
    process.exit(1);
  }
}

checkDoctors();














