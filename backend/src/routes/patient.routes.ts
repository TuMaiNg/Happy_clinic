import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { PatientModel } from '../models/Patient';
import { UserModel } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import asyncHandler from '../middleware/asyncHandler';
import pool from '../config/database';
import { hashPassword } from '../utils/bcrypt';
import { validateEmail } from '../utils/passwordValidator';
import { validateIntParam, validateIntQuery } from '../utils/validation';

const router = Router();

router.get('/', authenticate, authorize('staff', 'admin'), asyncHandler(async (req, res) => {
  // Support both 'search' and 'phone' query parameters
  const search = (req.query.search as string) || (req.query.phone as string);
  const patients = await PatientModel.findAll({
    search: search,
    limit: validateIntQuery(req.query.limit as string, 50, 1, 100),
    offset: validateIntQuery(req.query.offset as string, 0, 0),
  });
  res.json({ success: true, data: patients });
}));

router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const patientId = validateIntParam(req.params.id, 'patientId');
  const patient = await PatientModel.findById(patientId);
  if (!patient) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy bệnh nhân' });
  }
  return res.json({ success: true, data: patient });
}));

// Create patient (admin/staff only)
router.post('/', authenticate, authorize('staff', 'admin'), asyncHandler(async (req, res) => {
  const { fullName, phone, email, birthday, gender, address } = req.body;

  if (!fullName || !phone) {
    throw new AppError('Vui lòng điền đầy đủ thông tin bắt buộc (tên, số điện thoại)', 400);
  }

  // Check if phone already exists
  const existingPatient = await PatientModel.findByPhone(phone);
  if (existingPatient) {
    throw new AppError('Số điện thoại đã được sử dụng', 409);
  }

  // If email provided, validate it
  if (email && !validateEmail(email)) {
    throw new AppError('Email không hợp lệ', 400);
  }

  // Check if email already exists in users table
  if (email) {
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new AppError('Email đã được sử dụng', 409);
    }
  }

  // Use transaction with connection to ensure atomicity
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Create user account if email provided
    let userId: number | undefined;
    if (email) {
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

      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
      const passwordHash = await hashPassword(tempPassword);
      
      const [userResult] = await connection.query(
        `INSERT INTO users (email, password_hash, role, status) 
         VALUES (?, ?, ?, ?)`,
        [email, passwordHash, 'patient', 'active']
      ) as any;
      
      userId = userResult.insertId;
    }

    // Check if phone already exists (inside transaction to prevent race condition)
    const [existingPhoneRows] = await connection.query(
      'SELECT id FROM patients WHERE phone = ?',
      [phone]
    ) as any[];
    if (existingPhoneRows.length > 0) {
      await connection.rollback();
      connection.release();
      throw new AppError('Số điện thoại đã được sử dụng', 409);
    }

    // Create patient record
    const [patientResult] = await connection.query(
      `INSERT INTO patients (user_id, full_name, phone, email, birthday, gender, address) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        fullName,
        phone,
        email || null,
        birthday ? new Date(birthday) : null,
        gender ? parseInt(gender) : null,
        address || null,
      ]
    ) as any;

    const patientId = patientResult.insertId;
    
    // Get created patient
    const [patientRows] = await connection.query(
      'SELECT * FROM patients WHERE id = ?',
      [patientId]
    ) as any[];
    const patient = {
      id: patientRows[0].id,
      userId: patientRows[0].user_id,
      fullName: patientRows[0].full_name,
      phone: patientRows[0].phone,
      email: patientRows[0].email,
      birthday: patientRows[0].birthday,
      gender: patientRows[0].gender,
      address: patientRows[0].address,
    };

    // Commit transaction
    await connection.commit();
    connection.release();

    res.status(201).json({
      success: true,
      message: 'Tạo bệnh nhân thành công',
      data: patient,
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
    
    // Error is handled by errorHandler middleware
    if (error.code === 'ER_DUP_ENTRY') {
      throw new AppError('Thông tin đã tồn tại trong hệ thống', 409);
    }
    
    if (error instanceof AppError) {
      throw error;
    }
    
    // Log detailed error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Error creating patient:', {
        code: error.code,
        sqlMessage: error.sqlMessage,
        message: error.message,
        stack: error.stack,
      });
    }
    
    const errorMessage = error.sqlMessage || error.message || 'Lỗi không xác định';
    throw new AppError(`Không thể tạo bệnh nhân: ${errorMessage}`, 500);
  }
}));

// Update patient
router.put('/:id', authenticate, authorize('staff', 'admin'), asyncHandler(async (req, res) => {
  const patientId = validateIntParam(req.params.id, 'patientId');
  const { fullName, phone, email, birthday, gender, address } = req.body;

  const existingPatient = await PatientModel.findById(patientId);
  if (!existingPatient) {
    throw new AppError('Không tìm thấy bệnh nhân', 404);
  }

  // Check if phone is being changed and already exists
  if (phone && phone !== existingPatient.phone) {
    const phoneExists = await PatientModel.findByPhone(phone);
    if (phoneExists && phoneExists.id !== patientId) {
      throw new AppError('Số điện thoại đã được sử dụng', 409);
    }
  }

  // Validate email if provided
  if (email && !validateEmail(email)) {
    throw new AppError('Email không hợp lệ', 400);
  }

  const updatedPatient = await PatientModel.update(patientId, {
    fullName,
    phone,
    email: email !== undefined ? email : existingPatient.email,
    birthday: birthday ? new Date(birthday) : existingPatient.birthday,
    gender: gender !== undefined ? parseInt(gender) : existingPatient.gender,
    address: address !== undefined ? address : existingPatient.address,
  });

  if (!updatedPatient) {
    throw new AppError('Không thể cập nhật bệnh nhân', 500);
  }

  res.json({
    success: true,
    message: 'Cập nhật bệnh nhân thành công',
    data: updatedPatient,
  });
}));

export default router;
