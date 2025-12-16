import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DoctorModel } from '../models/Doctor';
import { UserModel } from '../models/User';
import { hashPassword } from '../utils/bcrypt';
import { AppError } from '../middleware/errorHandler';
import pool from '../config/database';
import { validatePassword, validateEmail } from '../utils/passwordValidator';

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

  try {
    // Start transaction
    await pool.query('START TRANSACTION');

    // Create user account with doctor role
    const user = await UserModel.create({
      email,
      passwordHash,
      role: 'doctor',
      status: 'active',
    });

    // Create doctor record
    const doctor = await DoctorModel.create({
      userId: user.id!,
      fullName,
      speciality,
      description: description || undefined,
      experienceYears: experienceYears ? parseInt(experienceYears) : undefined,
      licenseNumber: licenseNumber || undefined,
    });

    // Commit transaction
    await pool.query('COMMIT');

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
    await pool.query('ROLLBACK');
    
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

  const doctorId = parseInt(req.params.id);
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

  const doctorId = parseInt(req.params.id);
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

