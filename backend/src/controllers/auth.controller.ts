import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserModel } from '../models/User';
import { PatientModel } from '../models/Patient';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateTokens } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import pool from '../config/database';
import { validatePassword, validateEmail } from '../utils/passwordValidator';
import { recordFailedLogin, clearLoginAttempts } from '../middleware/accountLockout';
import { getClientIp } from '../middleware/security';

export const register = async (req: AuthRequest, res: Response) => {
  const { email, password, fullName, phone, birthday, gender, address } = req.body;

  // Validation - only patients can register publicly
  if (!email || !password || !fullName || !phone) {
    throw new AppError('Vui lòng điền đầy đủ thông tin bắt buộc', 400);
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

    // Safety check: ensure user was created with an ID
    if (!user.id) {
      throw new AppError('Lỗi khi tạo tài khoản người dùng', 500);
    }

    // Create patient record
    const patient = await PatientModel.create({
      userId: user.id,
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
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Send welcome email
    try {
      const { emailService } = await import('../services/email.service');
      await emailService.sendWelcome(email, fullName);
    } catch (error) {
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
  } catch (error: any) {
    // Attempt to rollback transaction, but don't let rollback errors mask the original error
    try {
      await pool.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during transaction rollback:', rollbackError);
    }
    
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Đăng ký thất bại', 500);
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Vui lòng nhập email và mật khẩu', 400);
  }

  const ip = getClientIp(req);
  const user = await UserModel.findByEmail(email);
  
  if (!user) {
    // Record failed attempt even if user doesn't exist (prevent user enumeration)
    recordFailedLogin(email, ip);
    throw new AppError('Email hoặc mật khẩu không đúng', 401);
  }

  if (user.status !== 'active') {
    // Don't record failed login for locked accounts to prevent information leakage
    throw new AppError('Tài khoản đã bị khóa', 403);
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    recordFailedLogin(email, ip);
    throw new AppError('Email hoặc mật khẩu không đúng', 401);
  }

  // Clear login attempts on successful login
  clearLoginAttempts(email, ip);

  // Safety check: user from database should always have an ID
  if (!user.id) {
    throw new AppError('Lỗi hệ thống: thiếu thông tin người dùng', 500);
  }

  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  let profile = null;
  if (user.role === 'patient') {
    profile = await PatientModel.findByUserId(user.id);
  } else if (user.role === 'doctor') {
    const { DoctorModel } = await import('../models/Doctor');
    profile = await DoctorModel.findByUserId(user.id);
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

    // Safety check: user from database should always have an ID
    if (!user.id) {
      throw new AppError('Lỗi hệ thống: thiếu thông tin người dùng', 500);
    }

    const tokens = generateTokens({
      userId: user.id,
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

  // Validate password strength
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    throw new AppError(`Mật khẩu mới không đủ mạnh: ${passwordValidation.errors.join(', ')}`, 400);
  }

  const user = await UserModel.findById(req.user.id);
  if (!user) {
    throw new AppError('Người dùng không tồn tại', 404);
  }

  // Safety check: user from database should always have an ID
  if (!user.id) {
    throw new AppError('Lỗi hệ thống: thiếu thông tin người dùng', 500);
  }

  // Verify current password first (security: don't leak information about password match)
  const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Mật khẩu hiện tại không đúng', 401);
  }

  // Check if new password is same as current (after verifying current password is correct)
  const isSamePassword = await comparePassword(newPassword, user.passwordHash);
  if (isSamePassword) {
    throw new AppError('Mật khẩu mới phải khác mật khẩu hiện tại', 400);
  }

  const newPasswordHash = await hashPassword(newPassword);
  await UserModel.update(user.id, { passwordHash: newPasswordHash });

  res.json({
    success: true,
    message: 'Đổi mật khẩu thành công',
  });
};

