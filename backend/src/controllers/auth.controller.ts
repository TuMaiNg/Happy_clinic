import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserModel } from '../models/User';
import { PatientModel } from '../models/Patient';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateTokens } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import pool from '../config/database';

export const register = async (req: AuthRequest, res: Response) => {
  const { email, password, fullName, phone, birthday, gender, address } = req.body;

  // Validation - only patients can register publicly
  if (!email || !password || !fullName || !phone) {
    throw new AppError('Vui lòng điền đầy đủ thông tin bắt buộc', 400);
  }

  // Check if email already exists
  const existingUser = await UserModel.findByEmail(email);
  if (existingUser) {
    throw new AppError('Email đã được sử dụng', 409);
  }

  // Check if phone already exists
  const [existingPhone] = await pool.query(
    'SELECT id FROM patients WHERE phone = ?',
    [phone]
  ) as any[];
  if (existingPhone.length > 0) {
    throw new AppError('Số điện thoại đã được sử dụng', 409);
  }

  const passwordHash = await hashPassword(password);

  try {
    // Start transaction
    await pool.query('START TRANSACTION');

    // Create user account (role = patient only for public registration)
    const user = await UserModel.create({
      email,
      passwordHash,
      role: 'patient', // Public registration is ONLY for patients
      status: 'active',
    });

    // Create patient record
    const patient = await PatientModel.create({
      userId: user.id!,
      fullName,
      phone,
      email, // Store email in patient record too
      birthday: birthday ? new Date(birthday) : undefined,
      gender,
      address,
    });

    // Commit transaction
    await pool.query('COMMIT');

    const tokens = generateTokens({
      userId: user.id!,
      email: user.email,
      role: user.role,
    });

    // Send welcome email
    try {
      const { emailService } = await import('../services/email.service');
      await emailService.sendWelcome(email, fullName);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName,
          role: user.role,
        },
        patient: {
          id: patient.id,
          fullName: patient.fullName,
          phone: patient.phone,
        },
        tokens,
      },
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Registration error:', error);
    throw new AppError('Đăng ký thất bại', 500);
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Vui lòng nhập email và mật khẩu', 400);
  }

  const user = await UserModel.findByEmail(email);
  if (!user) {
    throw new AppError('Email hoặc mật khẩu không đúng', 401);
  }

  if (user.status !== 'active') {
    throw new AppError('Tài khoản đã bị khóa', 403);
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Email hoặc mật khẩu không đúng', 401);
  }

  const tokens = generateTokens({
    userId: user.id!,
    email: user.email,
    role: user.role,
  });

  let profile = null;
  if (user.role === 'patient') {
    profile = await PatientModel.findByUserId(user.id!);
  } else if (user.role === 'doctor') {
    const { DoctorModel } = await import('../models/Doctor');
    profile = await DoctorModel.findByUserId(user.id!);
  }

  res.json({
    success: true,
    message: 'Đăng nhập thành công',
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      profile,
      tokens,
    },
  });
};

export const refreshToken = async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token không được để trống', 400);
  }

  try {
    const { verifyToken } = await import('../utils/jwt');
    const decoded = verifyToken(refreshToken, true);

    const user = await UserModel.findById(decoded.userId);
    if (!user || user.status !== 'active') {
      throw new AppError('Người dùng không tồn tại hoặc đã bị khóa', 401);
    }

    const tokens = generateTokens({
      userId: user.id!,
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      data: { tokens },
    });
  } catch (error) {
    throw new AppError('Refresh token không hợp lệ', 401);
  }
};

export const forgotPassword = async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Tính năng đang được phát triển',
  });
};

export const resetPassword = async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Tính năng đang được phát triển',
  });
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Không có quyền truy cập', 403);
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Vui lòng nhập mật khẩu hiện tại và mật khẩu mới', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('Mật khẩu mới phải có ít nhất 6 ký tự', 400);
  }

  const user = await UserModel.findById(req.user.id);
  if (!user) {
    throw new AppError('Người dùng không tồn tại', 404);
  }

  const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Mật khẩu hiện tại không đúng', 401);
  }

  const newPasswordHash = await hashPassword(newPassword);
  await UserModel.update(user.id!, { passwordHash: newPasswordHash });

  res.json({
    success: true,
    message: 'Đổi mật khẩu thành công',
  });
};

