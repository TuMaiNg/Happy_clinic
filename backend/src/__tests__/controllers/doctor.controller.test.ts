/**
 * Doctor Controller Tests
 * Tests for doctor CRUD operations
 */

import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

// Mock all dependencies
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

jest.mock('../../models/Doctor', () => ({
  DoctorModel: {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    findByUserId: jest.fn(),
  },
}));

jest.mock('../../models/User', () => ({
  UserModel: {
    findByEmail: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../utils/bcrypt', () => ({
  hashPassword: jest.fn(),
}));

jest.mock('../../utils/passwordValidator', () => ({
  validatePassword: jest.fn(() => ({ isValid: true, errors: [] })),
  validateEmail: jest.fn(() => true),
}));

import { DoctorModel } from '../../models/Doctor';
import { UserModel } from '../../models/User';
import { hashPassword } from '../../utils/bcrypt';
import * as doctorController from '../../controllers/doctor.controller';

describe('Doctor Controller', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('createDoctor', () => {
    beforeEach(() => {
      mockReq = {
        user: { id: 1, email: 'admin@example.com', role: 'admin' },
        body: {
          email: 'doctor@example.com',
          password: 'password123',
          fullName: 'Dr. Test',
          speciality: 'Cardiology',
          description: 'Test doctor',
          experienceYears: 10,
          licenseNumber: 'LIC123',
        },
      };
    });

    it('should reject if user is not admin or staff', async () => {
      mockReq.user = { id: 1, email: 'patient@example.com', role: 'patient' };

      await expect(
        doctorController.createDoctor(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Chỉ quản trị viên mới có thể tạo tài khoản bác sĩ');
    });

    it('should reject without required fields', async () => {
      mockReq.body = { email: 'doctor@example.com' };

      await expect(
        doctorController.createDoctor(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Vui lòng điền đầy đủ thông tin bắt buộc');
    });

    it('should reject with existing email', async () => {
      const existingUser = {
        id: 1,
        email: 'doctor@example.com',
      };

      (UserModel.findByEmail as jest.Mock).mockResolvedValue(existingUser);

      await expect(
        doctorController.createDoctor(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Email đã được sử dụng');
    });

    it('should create doctor successfully', async () => {
      const pool = require('../../config/database').default;
      const mockUser = {
        id: 1,
        email: 'doctor@example.com',
        role: 'doctor',
      };
      const mockDoctor = {
        id: 1,
        userId: 1,
        fullName: 'Dr. Test',
        speciality: 'Cardiology',
      };

      (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (UserModel.create as jest.Mock).mockResolvedValue(mockUser);
      (DoctorModel.create as jest.Mock).mockResolvedValue(mockDoctor);
      
      pool.query = jest.fn()
        .mockResolvedValueOnce([[]]) // User insert
        .mockResolvedValueOnce([[]]); // Doctor insert

      await doctorController.createDoctor(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });

  describe('updateDoctor', () => {
    beforeEach(() => {
      mockReq = {
        user: { id: 1, email: 'admin@example.com', role: 'admin' },
        params: { id: '1' },
        body: {
          fullName: 'Dr. Updated',
          speciality: 'Neurology',
        },
      };
    });

    it('should reject if doctor not found', async () => {
      (DoctorModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        doctorController.updateDoctor(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Không tìm thấy bác sĩ');
    });

    it('should update doctor successfully', async () => {
      const mockDoctor = {
        id: 1,
        userId: 1,
        fullName: 'Dr. Test',
        speciality: 'Cardiology',
      };
      const updatedDoctor = {
        ...mockDoctor,
        fullName: 'Dr. Updated',
        speciality: 'Neurology',
      };

      (DoctorModel.findById as jest.Mock).mockResolvedValue(mockDoctor);
      (DoctorModel.update as jest.Mock).mockResolvedValue(updatedDoctor);

      await doctorController.updateDoctor(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });

  describe('deleteDoctor', () => {
    beforeEach(() => {
      mockReq = {
        user: { id: 1, email: 'admin@example.com', role: 'admin' },
        params: { id: '1' },
      };
    });

    it('should reject if user is not admin', async () => {
      mockReq.user = { id: 1, email: 'staff@example.com', role: 'staff' };

      await expect(
        doctorController.deleteDoctor(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Chỉ quản trị viên mới có thể xóa bác sĩ');
    });

    it('should reject if doctor not found', async () => {
      (DoctorModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        doctorController.deleteDoctor(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Không tìm thấy bác sĩ');
    });

    it('should delete doctor successfully', async () => {
      const pool = require('../../config/database').default;
      const mockDoctor = {
        id: 1,
        userId: 1,
        fullName: 'Dr. Test',
      };

      (DoctorModel.findById as jest.Mock).mockResolvedValue(mockDoctor);
      pool.query = jest.fn()
        .mockResolvedValueOnce([[{ count: 0 }]]) // Check appointments count (no appointments)
        .mockResolvedValueOnce([[]]) // START TRANSACTION
        .mockResolvedValueOnce([[]]) // Delete doctor
        .mockResolvedValueOnce([[]]) // Delete user
        .mockResolvedValueOnce([[]]); // COMMIT

      await doctorController.deleteDoctor(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Xóa bác sĩ thành công',
        })
      );
    });
  });
});


