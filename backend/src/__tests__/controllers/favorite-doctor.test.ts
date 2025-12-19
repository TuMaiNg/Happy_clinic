/**
 * Favorite Doctor Controller Tests
 */

import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

// Mock all dependencies
jest.mock('../../models/FavoriteDoctor', () => ({
  FavoriteDoctorModel: {
    create: jest.fn(),
    findByPatient: jest.fn(),
    delete: jest.fn(),
    isFavorite: jest.fn(),
    findByPatientAndDoctor: jest.fn(),
  },
}));

jest.mock('../../models/Patient', () => ({
  PatientModel: {
    findByUserId: jest.fn(),
  },
}));

jest.mock('../../models/Doctor', () => ({
  DoctorModel: {
    findById: jest.fn(),
  },
}));

import { FavoriteDoctorModel } from '../../models/FavoriteDoctor';
import { PatientModel } from '../../models/Patient';
import { DoctorModel } from '../../models/Doctor';
import * as favoriteDoctorController from '../../controllers/favorite-doctor.controller';

describe('Favorite Doctor Controller', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('getFavorites', () => {
    it('should reject request without authentication', async () => {
      mockReq = {
        user: undefined,
      };

      await expect(
        favoriteDoctorController.getFavorites(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow(AppError);
    });

    it('should reject if user is not a patient', async () => {
      mockReq = {
        user: { id: 1, email: 'doctor@example.com', role: 'doctor' },
      };

      await expect(
        favoriteDoctorController.getFavorites(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Chỉ bệnh nhân mới có thể xem bác sĩ yêu thích');
    });

    it('should get favorites successfully', async () => {
      mockReq = {
        user: { id: 1, email: 'patient@example.com', role: 'patient' },
      };

      const mockPatient = { id: 1, userId: 1 };
      const mockFavorites = [
        {
          id: 1,
          patientId: 1,
          doctorId: 1,
          doctor: {
            id: 1,
            fullName: 'Dr. Test',
            speciality: 'General',
          },
        },
      ];

      (PatientModel.findByUserId as jest.Mock).mockResolvedValue(mockPatient);
      (FavoriteDoctorModel.findByPatient as jest.Mock).mockResolvedValue(mockFavorites);

      await favoriteDoctorController.getFavorites(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockFavorites,
      });
    });

    it('should reject if patient profile not found', async () => {
      mockReq = {
        user: { id: 1, email: 'patient@example.com', role: 'patient' },
      };

      (PatientModel.findByUserId as jest.Mock).mockResolvedValue(null);

      await expect(
        favoriteDoctorController.getFavorites(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Không tìm thấy thông tin bệnh nhân');
    });
  });

  describe('addFavorite', () => {
    it('should reject request without authentication', async () => {
      mockReq = {
        user: undefined,
        body: { doctorId: 1 },
      };

      await expect(
        favoriteDoctorController.addFavorite(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow(AppError);
    });

    it('should reject if user is not a patient', async () => {
      mockReq = {
        user: { id: 1, email: 'doctor@example.com', role: 'doctor' },
        body: { doctorId: 1 },
      };

      await expect(
        favoriteDoctorController.addFavorite(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Chỉ bệnh nhân mới có thể thêm bác sĩ yêu thích');
    });

    it('should reject if doctorId is missing', async () => {
      mockReq = {
        user: { id: 1, email: 'patient@example.com', role: 'patient' },
        body: {},
      };

      await expect(
        favoriteDoctorController.addFavorite(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Thiếu doctorId');
    });

    it('should reject if doctor not found', async () => {
      mockReq = {
        user: { id: 1, email: 'patient@example.com', role: 'patient' },
        body: { doctorId: 999 },
      };

      const mockPatient = { id: 1, userId: 1 };
      (PatientModel.findByUserId as jest.Mock).mockResolvedValue(mockPatient);
      (DoctorModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        favoriteDoctorController.addFavorite(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Không tìm thấy bác sĩ');
    });

    it('should add favorite successfully', async () => {
      mockReq = {
        user: { id: 1, email: 'patient@example.com', role: 'patient' },
        body: { doctorId: 1 },
      };

      const mockPatient = { id: 1, userId: 1 };
      const mockDoctor = { id: 1, fullName: 'Dr. Test' };
      const mockFavorite = {
        id: 1,
        patientId: 1,
        doctorId: 1,
        createdAt: new Date(),
      };

      (PatientModel.findByUserId as jest.Mock).mockResolvedValue(mockPatient);
      (DoctorModel.findById as jest.Mock).mockResolvedValue(mockDoctor);
      (FavoriteDoctorModel.create as jest.Mock).mockResolvedValue(mockFavorite);

      await favoriteDoctorController.addFavorite(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Đã thêm vào danh sách yêu thích',
        data: mockFavorite,
      });
    });
  });

  describe('removeFavorite', () => {
    it('should reject request without authentication', async () => {
      mockReq = {
        user: undefined,
        params: { doctorId: '1' },
      };

      await expect(
        favoriteDoctorController.removeFavorite(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow(AppError);
    });

    it('should reject if user is not a patient', async () => {
      mockReq = {
        user: { id: 1, email: 'doctor@example.com', role: 'doctor' },
        params: { doctorId: '1' },
      };

      await expect(
        favoriteDoctorController.removeFavorite(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Chỉ bệnh nhân mới có thể xóa bác sĩ yêu thích');
    });

    it('should remove favorite successfully', async () => {
      mockReq = {
        user: { id: 1, email: 'patient@example.com', role: 'patient' },
        params: { doctorId: '1' },
      };

      const mockPatient = { id: 1, userId: 1 };
      (PatientModel.findByUserId as jest.Mock).mockResolvedValue(mockPatient);
      (FavoriteDoctorModel.delete as jest.Mock).mockResolvedValue(true);

      await favoriteDoctorController.removeFavorite(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Đã xóa khỏi danh sách yêu thích',
      });
    });

    it('should reject if favorite not found', async () => {
      mockReq = {
        user: { id: 1, email: 'patient@example.com', role: 'patient' },
        params: { doctorId: '999' },
      };

      const mockPatient = { id: 1, userId: 1 };
      (PatientModel.findByUserId as jest.Mock).mockResolvedValue(mockPatient);
      (FavoriteDoctorModel.delete as jest.Mock).mockResolvedValue(false);

      await expect(
        favoriteDoctorController.removeFavorite(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Không tìm thấy bác sĩ yêu thích này');
    });
  });

  describe('checkFavorite', () => {
    it('should reject request without authentication', async () => {
      mockReq = {
        user: undefined,
        params: { doctorId: '1' },
      };

      await expect(
        favoriteDoctorController.checkFavorite(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow(AppError);
    });

    it('should reject if user is not a patient', async () => {
      mockReq = {
        user: { id: 1, email: 'doctor@example.com', role: 'doctor' },
        params: { doctorId: '1' },
      };

      await expect(
        favoriteDoctorController.checkFavorite(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Chỉ bệnh nhân mới có thể kiểm tra bác sĩ yêu thích');
    });

    it('should return true if doctor is favorite', async () => {
      mockReq = {
        user: { id: 1, email: 'patient@example.com', role: 'patient' },
        params: { doctorId: '1' },
      };

      const mockPatient = { id: 1, userId: 1 };
      (PatientModel.findByUserId as jest.Mock).mockResolvedValue(mockPatient);
      (FavoriteDoctorModel.isFavorite as jest.Mock).mockResolvedValue(true);

      await favoriteDoctorController.checkFavorite(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { isFavorite: true },
      });
    });

    it('should return false if doctor is not favorite', async () => {
      mockReq = {
        user: { id: 1, email: 'patient@example.com', role: 'patient' },
        params: { doctorId: '1' },
      };

      const mockPatient = { id: 1, userId: 1 };
      (PatientModel.findByUserId as jest.Mock).mockResolvedValue(mockPatient);
      (FavoriteDoctorModel.isFavorite as jest.Mock).mockResolvedValue(false);

      await favoriteDoctorController.checkFavorite(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { isFavorite: false },
      });
    });
  });
});


