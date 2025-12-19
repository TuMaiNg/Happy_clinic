import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DoctorModel } from '../models/Doctor';
import { UserModel } from '../models/User';
import { hashPassword } from '../utils/bcrypt';
import { AppError } from '../middleware/errorHandler';
import pool from '../config/database';
import { validatePassword, validateEmail } from '../utils/passwordValidator';
import { validateIntParam } from '../utils/validation';

export const createDoctor = async (req: AuthRequest, res: Response) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
    throw new AppError('Chỉ quản trị viên mới có thể tạo tài khoản bác sĩ', 403);
  }

  const {
    email,
    password,
    fullName,
    speciality,
    description,
    experienceYears,
    licenseNumber,
  } = req.body;

  // Validation
  if (!email || !password || !fullName || !speciality) {
    throw new AppError('Vui lòng điền đầy đủ thông tin bắt buộc (email, mật khẩu, tên, chuyên khoa)', 400);
  }

  // Check if email already exists
  const existingUser = await UserModel.findByEmail(email);
  if (existingUser) {
    throw new AppError('Email đã được sử dụng', 409);
  }

  // Validate email format
  if (!validateEmail(email)) {
    throw new AppError('Email không hợp lệ', 400);
  }

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    throw new AppError(`Mật khẩu không đủ mạnh: ${passwordValidation.errors.join(', ')}`, 400);
  }

  const passwordHash = await hashPassword(password);

  // Use transaction with connection to ensure atomicity
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Check if email already exists (inside transaction to prevent race condition)
    const [existingUserRows] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as any[];
    if (existingUserRows.length > 0) {
      await connection.rollback();
      connection.release();
      throw new AppError('Email đã được sử dụng', 409);
    }

    // Create user account with doctor role
    const [userResult] = await connection.query(
      `INSERT INTO users (email, password_hash, role, status) 
       VALUES (?, ?, ?, ?)`,
      [email, passwordHash, 'doctor', 'active']
    ) as any;

    const userId = userResult.insertId;
    if (!userId) {
      await connection.rollback();
      connection.release();
      throw new AppError('Lỗi khi tạo tài khoản người dùng', 500);
    }

    // Get created user
    const [userRows] = await connection.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    ) as any[];
    const user = {
      id: userRows[0].id,
      email: userRows[0].email,
      role: userRows[0].role,
    };

    // Create doctor record
    const [doctorResult] = await connection.query(
      `INSERT INTO doctors (user_id, full_name, speciality, description, experience_years, license_number) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        fullName,
        speciality,
        description || null,
        experienceYears ? parseInt(experienceYears) : null,
        licenseNumber || null,
      ]
    ) as any;

    const doctorId = doctorResult.insertId;
    
    // Get created doctor
    const [doctorRows] = await connection.query(
      'SELECT * FROM doctors WHERE id = ?',
      [doctorId]
    ) as any[];
    const doctor = {
      id: doctorRows[0].id,
      userId: doctorRows[0].user_id,
      fullName: doctorRows[0].full_name,
      speciality: doctorRows[0].speciality,
    };

    // Commit transaction
    await connection.commit();
    connection.release();

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản bác sĩ thành công',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        doctor: {
          id: doctor.id,
          fullName: doctor.fullName,
          speciality: doctor.speciality,
        },
      },
    });
  } catch (error: any) {
    // Attempt to rollback transaction, but don't let rollback errors mask the original error
    try {
      if (connection) {
        await connection.rollback();
      }
    } catch (rollbackError) {
      console.error('Error during transaction rollback:', rollbackError);
    } finally {
      if (connection) {
        connection.release();
      }
    }
    
    if (error.code === 'ER_DUP_ENTRY') {
      throw new AppError('Thông tin đã tồn tại trong hệ thống', 409);
    }
    
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError('Không thể tạo tài khoản bác sĩ', 500);
  }
};

export const updateDoctor = async (req: AuthRequest, res: Response) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
    throw new AppError('Chỉ quản trị viên mới có thể cập nhật thông tin bác sĩ', 403);
  }

  const doctorId = validateIntParam(req.params.id, 'doctorId');
  if (isNaN(doctorId) || doctorId <= 0) {
    throw new AppError('ID bác sĩ không hợp lệ', 400);
  }
  const updates = req.body;

  const doctor = await DoctorModel.findById(doctorId);
  if (!doctor) {
    throw new AppError('Không tìm thấy bác sĩ', 404);
  }

  const updated = await DoctorModel.update(doctorId, updates);
  res.json({
    success: true,
    message: 'Cập nhật thông tin bác sĩ thành công',
    data: updated,
  });
};

export const deleteDoctor = async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'admin') {
    throw new AppError('Chỉ quản trị viên mới có thể xóa bác sĩ', 403);
  }

  const doctorId = validateIntParam(req.params.id, 'doctorId');
  if (isNaN(doctorId) || doctorId <= 0) {
    throw new AppError('ID bác sĩ không hợp lệ', 400);
  }
  const doctor = await DoctorModel.findById(doctorId);
  if (!doctor) {
    throw new AppError('Không tìm thấy bác sĩ', 404);
  }

  // Check if doctor has appointments
  const [appointments] = await pool.query(
    'SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ?',
    [doctorId]
  ) as any[];

  if (appointments && appointments.length > 0 && appointments[0].count > 0) {
    throw new AppError('Không thể xóa bác sĩ đã có lịch hẹn. Vui lòng vô hiệu hóa tài khoản thay vì xóa.', 400);
  }

  try {
    await pool.query('START TRANSACTION');

    // Delete doctor record
    await pool.query('DELETE FROM doctors WHERE id = ?', [doctorId]);

    // Delete user account
    await pool.query('DELETE FROM users WHERE id = ?', [doctor.userId]);

    await pool.query('COMMIT');

    res.json({
      success: true,
      message: 'Xóa bác sĩ thành công',
    });
  } catch (error: any) {
    await pool.query('ROLLBACK');
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Không thể xóa bác sĩ', 500);
  }
};

export const doctorController = {
  createDoctor,
  updateDoctor,
  deleteDoctor,
};

