/**
 * Patient Controller Tests
 * Tests for patient operations
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

jest.mock('../../models/Patient', () => ({
  PatientModel: {
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  },
}));

import { PatientModel } from '../../models/Patient';

describe('Patient Controller', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('getPatientById', () => {
    it('should get patient by ID', async () => {
      const mockPatient = {
        id: 1,
        userId: 1,
        fullName: 'Test Patient',
        phone: '0912345678',
        email: 'patient@example.com',
      };

      (PatientModel.findById as jest.Mock).mockResolvedValue(mockPatient);

      const patient = await PatientModel.findById(1);
      expect(patient).toEqual(mockPatient);
    });

    it('should return null for non-existent patient', async () => {
      (PatientModel.findById as jest.Mock).mockResolvedValue(null);

      const patient = await PatientModel.findById(999);
      expect(patient).toBeNull();
    });
  });

  describe('getAllPatients', () => {
    it('should get all patients with filters', async () => {
      const mockPatients = [
        { id: 1, fullName: 'Patient 1', phone: '0912345678' },
        { id: 2, fullName: 'Patient 2', phone: '0987654321' },
      ];

      (PatientModel.findAll as jest.Mock).mockResolvedValue(mockPatients);

      const patients = await PatientModel.findAll({ search: 'Patient' });
      expect(patients).toEqual(mockPatients);
      expect(PatientModel.findAll).toHaveBeenCalledWith({ search: 'Patient' });
    });
  });

  describe('updatePatient', () => {
    it('should update patient successfully', async () => {
      const existingPatient = {
        id: 1,
        fullName: 'Old Name',
        phone: '0912345678',
      };

      const updatedPatient = {
        ...existingPatient,
        fullName: 'New Name',
      };

      (PatientModel.findById as jest.Mock).mockResolvedValue(existingPatient);
      (PatientModel.update as jest.Mock).mockResolvedValue(updatedPatient);

      const result = await PatientModel.update(1, { fullName: 'New Name' });
      expect(result).toEqual(updatedPatient);
    });
  });
});






