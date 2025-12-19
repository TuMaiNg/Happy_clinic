/**
 * Script to setup doctor "Anbasin" with schedule and services
 * - Find or create doctor "Anbasin"
 * - Create services: "Bơm tim" and "Kiểm tra máu"
 * - Generate schedule for 30 days ahead (same pattern as other doctors)
 */

import pool from '../config/database';
import { DoctorModel } from '../models/Doctor';
import { ServiceModel } from '../models/Service';
import { scheduleGeneratorService } from '../services/schedule-generator.service';
import { UserModel } from '../models/User';
import bcrypt from 'bcrypt';

async function setupAnbasinDoctor() {
  try {
    console.log('🔍 Đang tìm bác sĩ Anbasin...');
    
    // Tìm bác sĩ có tên chứa "anbasin" (case-insensitive)
    const [doctors] = await pool.query(
      `SELECT d.*, u.email 
       FROM doctors d 
       JOIN users u ON d.user_id = u.id 
       WHERE LOWER(d.full_name) LIKE '%anbasin%'`
    ) as any[];

    let doctor: any;
    
    if (doctors.length > 0) {
      doctor = doctors[0];
      console.log(`✅ Tìm thấy bác sĩ: ${doctor.full_name || doctor.email} (ID: ${doctor.id})`);
    } else {
      console.log('⚠️  Không tìm thấy bác sĩ Anbasin, đang tạo mới...');
      
      // Tạo user account cho bác sĩ
      const hashedPassword = await bcrypt.hash('Anbasin123!', 10);
      const [userResult] = await pool.query(
        `INSERT INTO users (email, password, role, is_active, email_verified) 
         VALUES (?, ?, 'doctor', 1, 1)`,
        ['anbasin@clinic.com', hashedPassword]
      ) as any;
      
      const userId = userResult.insertId;
      console.log(`✅ Đã tạo user account (ID: ${userId})`);
      
      // Tạo doctor record
      const [doctorResult] = await pool.query(
        `INSERT INTO doctors (user_id, full_name, speciality, phone, is_active) 
         VALUES (?, ?, ?, ?, 1)`,
        [userId, 'Bác sĩ Anbasin', 'Tim mạch', '0900000000']
      ) as any;
      
      doctor = {
        id: doctorResult.insertId,
        user_id: userId,
        full_name: 'Bác sĩ Anbasin',
        speciality: 'Tim mạch',
      };
      
      console.log(`✅ Đã tạo bác sĩ Anbasin (ID: ${doctor.id})`);
    }

    // Kiểm tra và tạo dịch vụ "Bơm tim"
    console.log('\n🔍 Đang kiểm tra dịch vụ "Bơm tim"...');
    const [bomTimServices] = await pool.query(
      `SELECT * FROM services WHERE LOWER(name) LIKE '%bơm tim%' OR LOWER(name) LIKE '%bom tim%'`
    ) as any[];
    
    let bomTimService: any;
    if (bomTimServices.length > 0) {
      bomTimService = bomTimServices[0];
      console.log(`✅ Dịch vụ "Bơm tim" đã tồn tại (ID: ${bomTimService.id})`);
    } else {
      bomTimService = await ServiceModel.create({
        name: 'Bơm tim',
        speciality: doctor.speciality || 'Tim mạch',
        description: 'Dịch vụ bơm tim chuyên nghiệp',
        price: 500000,
        durationMinutes: 30,
        isActive: true,
      });
      console.log(`✅ Đã tạo dịch vụ "Bơm tim" (ID: ${bomTimService.id})`);
    }

    // Kiểm tra và tạo dịch vụ "Kiểm tra máu"
    console.log('\n🔍 Đang kiểm tra dịch vụ "Kiểm tra máu"...');
    const [kiemTraMauServices] = await pool.query(
      `SELECT * FROM services WHERE LOWER(name) LIKE '%kiểm tra máu%' OR LOWER(name) LIKE '%kiem tra mau%' OR LOWER(name) LIKE '%xét nghiệm máu%'`
    ) as any[];
    
    let kiemTraMauService: any;
    if (kiemTraMauServices.length > 0) {
      kiemTraMauService = kiemTraMauServices[0];
      console.log(`✅ Dịch vụ "Kiểm tra máu" đã tồn tại (ID: ${kiemTraMauService.id})`);
    } else {
      kiemTraMauService = await ServiceModel.create({
        name: 'Kiểm tra máu',
        speciality: doctor.speciality || 'Tim mạch',
        description: 'Dịch vụ kiểm tra máu và xét nghiệm',
        price: 300000,
        durationMinutes: 20,
        isActive: true,
      });
      console.log(`✅ Đã tạo dịch vụ "Kiểm tra máu" (ID: ${kiemTraMauService.id})`);
    }

    // Tạo lịch làm việc cho 30 ngày tới (giống các bác sĩ khác)
    console.log('\n📅 Đang tạo lịch làm việc cho 30 ngày tới...');
    
    // Kiểm tra và xóa lịch cũ nếu có
    const [existingSchedules] = await pool.query(
      `SELECT id FROM doctor_schedules WHERE doctor_id = ? AND date >= CURDATE()`,
      [doctor.id]
    ) as any[];
    
    if (existingSchedules.length > 0) {
      console.log(`⚠️  Đã có ${existingSchedules.length} lịch làm việc, đang xóa để tạo lại...`);
      for (const sched of existingSchedules) {
        // Xóa time slots trước
        await pool.query(`DELETE FROM time_slots WHERE schedule_id = ?`, [sched.id]);
        // Xóa schedule
        await pool.query(`DELETE FROM doctor_schedules WHERE id = ?`, [sched.id]);
      }
      console.log(`✅ Đã xóa ${existingSchedules.length} lịch cũ`);
    }
    
    const schedules = await scheduleGeneratorService.generateDoctorSchedules(
      doctor.id,
      30, // 30 ngày
      [
        {
          startTime: '08:00',
          endTime: '12:00',
          daysOfWeek: [1, 2, 3, 4, 5], // Thứ 2 - Thứ 6 buổi sáng
        },
        {
          startTime: '13:00',
          endTime: '17:00',
          daysOfWeek: [1, 2, 3, 4, 5], // Thứ 2 - Thứ 6 buổi chiều
        },
      ]
    );

    console.log(`✅ Đã tạo ${schedules.length} lịch làm việc`);
    
    console.log('\n✅ Hoàn thành!');
    console.log(`\n📋 Tóm tắt:`);
    console.log(`   - Bác sĩ: ${doctor.full_name || 'Anbasin'} (ID: ${doctor.id})`);
    console.log(`   - Dịch vụ "Bơm tim": ${bomTimService.name} (ID: ${bomTimService.id})`);
    console.log(`   - Dịch vụ "Kiểm tra máu": ${kiemTraMauService.name} (ID: ${kiemTraMauService.id})`);
    console.log(`   - Lịch làm việc: ${schedules.length} ngày đã được tạo`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run script
setupAnbasinDoctor();

