/**
 * Appointment Controller Tests
 * Tests for appointment creation, confirmation, cancellation, and completion
 */

import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

// Mock all dependencies
jest.mock('../../config/database', () => ({
  query: jest.fn(),
}));

jest.mock('../../models/Appointment', () => ({
  AppointmentModel: {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../../models/TimeSlot', () => ({
  TimeSlotModel: {
    findById: jest.fn(),
    incrementPatientCount: jest.fn(),
    decrementPatientCount: jest.fn(),
  },
}));

jest.mock('../../models/Service', () => ({
  ServiceModel: {
    findById: jest.fn(),
  },
}));

jest.mock('../../models/Patient', () => ({
  PatientModel: {
    findByUserId: jest.fn(),
  },
}));

jest.mock('../../models/Doctor', () => ({
  DoctorModel: {
    findByUserId: jest.fn(),
  },
}));

jest.mock('../../services/socket.service', () => ({
  emitNotification: jest.fn(),
}));

jest.mock('../../services/email.service', () => ({
  emailService: {
    sendAppointmentConfirmation: jest.fn(),
  },
}));

import { AppointmentModel } from '../../models/Appointment';
import { TimeSlotModel } from '../../models/TimeSlot';
import { ServiceModel } from '../../models/Service';
import { PatientModel } from '../../models/Patient';
import { DoctorModel } from '../../models/Doctor';
import pool from '../../config/database';
import * as appointmentController from '../../controllers/appointment.controller';

describe('Appointment Controller', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('createAppointment', () => {
    beforeEach(() => {
      mockReq = {
        user: { id: 1, email: 'patient@example.com', role: 'patient' },
        body: {
          doctorId: 1,
          serviceId: 1,
          slotId: 1,
          appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          visitType: 'first-visit',
          symptoms: 'Test symptoms',
        },
      };
    });

    it('should reject request without authentication', async () => {
      mockReq.user = undefined;

      await expect(
        appointmentController.createAppointment(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow(AppError);
    });

    it('should reject request with missing required fields', async () => {
      mockReq.body = { doctorId: 1 }; // Missing other fields

      await expect(
        appointmentController.createAppointment(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Vui lòng điền đầy đủ thông tin');
    });

    it('should reject if patient profile not found', async () => {
      (PatientModel.findByUserId as jest.Mock).mockResolvedValue(null);

      await expect(
        appointmentController.createAppointment(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Không tìm thấy thông tin bệnh nhân');
    });

    it('should reject if time slot not found', async () => {
      (PatientModel.findByUserId as jest.Mock).mockResolvedValue({ id: 1, fullName: 'Test' });
      (TimeSlotModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        appointmentController.createAppointment(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Không tìm thấy khung giờ');
    });

    it('should reject if time slot is not available', async () => {
      (PatientModel.findByUserId as jest.Mock).mockResolvedValue({ id: 1, fullName: 'Test' });
      (TimeSlotModel.findById as jest.Mock).mockResolvedValue({
        id: 1,
        isAvailable: false,
        patientCount: 1,
        capacity: 1,
        scheduleId: 1,
        startTime: '09:00',
        endTime: '09:30',
      });

      await expect(
        appointmentController.createAppointment(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Khung giờ này đã hết chỗ');
    });

    it('should reject if service is not active', async () => {
      (PatientModel.findByUserId as jest.Mock).mockResolvedValue({ id: 1, fullName: 'Test' });
      (TimeSlotModel.findById as jest.Mock).mockResolvedValue({
        id: 1,
        isAvailable: true,
        patientCount: 0,
        capacity: 1,
        scheduleId: 1,
        startTime: '09:00',
        endTime: '09:30',
      });
      (ServiceModel.findById as jest.Mock).mockResolvedValue({ id: 1, isActive: false });

      await expect(
        appointmentController.createAppointment(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Dịch vụ không tồn tại hoặc đã bị vô hiệu hóa');
    });

    it('should create appointment successfully', async () => {
      const mockAppointment = {
        id: 1,
        patientId: 1,
        doctorId: 1,
        serviceId: 1,
        slotId: 1,
        status: 'pending',
      };

      (PatientModel.findByUserId as jest.Mock).mockResolvedValue({ id: 1, fullName: 'Test' });
      (TimeSlotModel.findById as jest.Mock).mockResolvedValue({
        id: 1,
        isAvailable: true,
        patientCount: 0,
        capacity: 1,
        scheduleId: 1,
        startTime: '09:00',
        endTime: '09:30',
      });
      (ServiceModel.findById as jest.Mock).mockResolvedValue({ id: 1, isActive: true });
      (AppointmentModel.findAll as jest.Mock).mockResolvedValue([]);
      (AppointmentModel.create as jest.Mock).mockResolvedValue(mockAppointment);
      (TimeSlotModel.incrementPatientCount as jest.Mock).mockResolvedValue(null);
      (pool.query as jest.Mock).mockResolvedValue([[{ user_id: 1, email: 'test@example.com' }]]);

      await appointmentController.createAppointment(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Đặt lịch thành công! Chúng tôi sẽ liên hệ xác nhận trong 2 giờ tới.',
        })
      );
    });
  });

  describe('confirmAppointment', () => {
    it('should only allow staff/admin to confirm appointments', async () => {
      mockReq = {
        user: { id: 1, email: 'patient@example.com', role: 'patient' },
        params: { id: '1' },
      };

      await expect(
        appointmentController.confirmAppointment(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow(AppError);
    });

    it('should allow staff to confirm appointment', async () => {
      mockReq = {
        user: { id: 1, email: 'staff@example.com', role: 'staff' },
        params: { id: '1' },
      };

      const mockAppointment = {
        id: 1,
        status: 'pending',
        patientId: 1,
      };

      (AppointmentModel.findById as jest.Mock).mockResolvedValue(mockAppointment);
      (AppointmentModel.update as jest.Mock).mockResolvedValue({ ...mockAppointment, status: 'confirmed' });
      (pool.query as jest.Mock).mockResolvedValue([[{ user_id: 2, email: 'patient@example.com' }]]);

      await appointmentController.confirmAppointment(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });

  describe('cancelAppointment', () => {
    it('should allow patient to cancel their own appointment', async () => {
      mockReq = {
        user: { id: 1, email: 'patient@example.com', role: 'patient' },
        params: { id: '1' },
        body: { reason: 'Cannot attend' },
      };

      const mockPatient = { id: 1, userId: 1 };
      const mockAppointment = {
        id: 1,
        patientId: 1,
        status: 'pending',
        slotId: 1,
      };

      (PatientModel.findByUserId as jest.Mock).mockResolvedValue(mockPatient);
      (AppointmentModel.findById as jest.Mock).mockResolvedValue(mockAppointment);
      (AppointmentModel.update as jest.Mock).mockResolvedValue({ ...mockAppointment, status: 'cancelled' });
      (TimeSlotModel.decrementPatientCount as jest.Mock).mockResolvedValue(null);

      await appointmentController.cancelAppointment(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('should not allow patient to cancel other patient appointment', async () => {
      mockReq = {
        user: { id: 1, email: 'patient@example.com', role: 'patient' },
        params: { id: '1' },
        body: { reason: 'Cannot attend' },
      };

      const mockPatient = { id: 1, userId: 1 };
      const mockAppointment = {
        id: 1,
        patientId: 2, // Different patient
        status: 'pending',
      };

      (PatientModel.findByUserId as jest.Mock).mockResolvedValue(mockPatient);
      (AppointmentModel.findById as jest.Mock).mockResolvedValue(mockAppointment);

      await expect(
        appointmentController.cancelAppointment(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Bạn không có quyền hủy lịch hẹn này');
    });
  });

  describe('completeAppointment', () => {
    it('should only allow doctor to complete appointments', async () => {
      mockReq = {
        user: { id: 1, email: 'patient@example.com', role: 'patient' },
        params: { id: '1' },
        body: { notes: 'Completed' },
      };

      await expect(
        appointmentController.completeAppointment(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow(AppError);
    });

    it('should allow doctor to complete their own appointment', async () => {
      mockReq = {
        user: { id: 1, email: 'doctor@example.com', role: 'doctor' },
        params: { id: '1' },
        body: { notes: 'Treatment completed' },
      };

      const mockDoctor = { id: 1, userId: 1 };
      const mockAppointment = {
        id: 1,
        doctorId: 1,
        status: 'checked-in',
      };

      (DoctorModel.findByUserId as jest.Mock).mockResolvedValue(mockDoctor);
      (AppointmentModel.findById as jest.Mock).mockResolvedValue(mockAppointment);
      (AppointmentModel.update as jest.Mock).mockResolvedValue({ ...mockAppointment, status: 'completed' });

      await appointmentController.completeAppointment(mockReq as AuthRequest, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });
});
