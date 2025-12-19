/**
 * Reschedule Appointment Controller Tests
 */

import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

// Mock all dependencies
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    getConnection: jest.fn(),
    query: jest.fn(),
  },
}));

jest.mock('../../models/Appointment', () => ({
  AppointmentModel: {
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../../models/TimeSlot', () => ({
  TimeSlotModel: {
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

jest.mock('../../config/env', () => ({
  config: {
    businessRules: {
      minLeadTimeHours: 2,
    },
  },
}));

jest.mock('../../services/socket.service', () => ({
  emitNotification: jest.fn(),
}));

jest.mock('../../services/email.service', () => ({
  emailService: {
    sendAppointmentRescheduled: jest.fn(),
  },
}));

import { AppointmentModel } from '../../models/Appointment';
import { TimeSlotModel } from '../../models/TimeSlot';
import { PatientModel } from '../../models/Patient';
import { DoctorModel } from '../../models/Doctor';
import pool from '../../config/database';
import * as appointmentController from '../../controllers/appointment.controller';
import { differenceInHours } from 'date-fns';

describe('Reschedule Appointment Controller', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockConnection: any;

  beforeEach(() => {
    mockConnection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      query: jest.fn(),
      release: jest.fn(),
    };

    (pool.getConnection as jest.Mock) = jest.fn().mockResolvedValue(mockConnection);

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('rescheduleAppointment', () => {
    const mockAppointment = {
      id: 1,
      patientId: 1,
      doctorId: 1,
      serviceId: 1,
      slotId: 1,
      appointmentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      startTime: '09:00:00',
      endTime: '09:30:00',
      status: 'confirmed',
    };

    const mockNewTimeSlot = {
      id: 2,
      scheduleId: 2,
      startTime: '14:00:00',
      endTime: '14:30:00',
      isAvailable: true,
      patientCount: 0,
      capacity: 5,
    };

    beforeEach(() => {
      mockReq = {
        user: { id: 1, email: 'patient@example.com', role: 'patient' },
        params: { id: '1' },
        body: {
          slotId: 2,
          appointmentDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
          reason: 'Need to change time',
        },
      };
    });

    it('should reject request without authentication', async () => {
      mockReq.user = undefined;

      await expect(
        appointmentController.rescheduleAppointment(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow(AppError);
    });

    it('should reject request with missing slotId or appointmentDate', async () => {
      mockReq.body = { slotId: 2 }; // Missing appointmentDate

      await expect(
        appointmentController.rescheduleAppointment(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Vui lòng điền đầy đủ thông tin');
    });

    it('should reject if appointment not found', async () => {
      (AppointmentModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        appointmentController.rescheduleAppointment(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Không tìm thấy lịch hẹn');
    });

    it('should reject if patient tries to reschedule other patient appointment', async () => {
      const otherAppointment = { ...mockAppointment, patientId: 2 };
      (AppointmentModel.findById as jest.Mock).mockResolvedValue(otherAppointment);
      (PatientModel.findByUserId as jest.Mock).mockResolvedValue({ id: 1 });

      await expect(
        appointmentController.rescheduleAppointment(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Bạn không có quyền đổi lịch hẹn này');
    });

    it('should reject if appointment status does not allow rescheduling', async () => {
      const completedAppointment = { ...mockAppointment, status: 'completed' };
      (AppointmentModel.findById as jest.Mock).mockResolvedValue(completedAppointment);
      (PatientModel.findByUserId as jest.Mock).mockResolvedValue({ id: 1 });

      await expect(
        appointmentController.rescheduleAppointment(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('không thể đổi lịch');
    });

    it('should reject if new time slot is not found', async () => {
      (AppointmentModel.findById as jest.Mock).mockResolvedValue(mockAppointment);
      (PatientModel.findByUserId as jest.Mock).mockResolvedValue({ id: 1 });
      (TimeSlotModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        appointmentController.rescheduleAppointment(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Khung giờ mới không tồn tại');
    });

    it('should reject if new time slot is full', async () => {
      const fullSlot = { ...mockNewTimeSlot, isAvailable: false, patientCount: 5 };
      (AppointmentModel.findById as jest.Mock).mockResolvedValue(mockAppointment);
      (PatientModel.findByUserId as jest.Mock).mockResolvedValue({ id: 1 });
      (TimeSlotModel.findById as jest.Mock).mockResolvedValue(fullSlot);

      await expect(
        appointmentController.rescheduleAppointment(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Khung giờ mới đã hết chỗ');
    });

    it('should reject if new slot is same as current slot', async () => {
      mockReq.body = {
        slotId: 1, // Same as current slot
        appointmentDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      };
      (AppointmentModel.findById as jest.Mock).mockResolvedValue(mockAppointment);
      (PatientModel.findByUserId as jest.Mock).mockResolvedValue({ id: 1 });
      (TimeSlotModel.findById as jest.Mock).mockResolvedValue(mockNewTimeSlot);

      await expect(
        appointmentController.rescheduleAppointment(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow('Khung giờ mới phải khác với khung giờ hiện tại');
    });

    it('should reschedule appointment successfully', async () => {
      (AppointmentModel.findById as jest.Mock)
        .mockResolvedValueOnce(mockAppointment)
        .mockResolvedValueOnce({
          ...mockAppointment,
          slotId: 2,
          appointmentDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          startTime: '14:00:00',
          status: 'pending',
        });
      (PatientModel.findByUserId as jest.Mock).mockResolvedValue({ id: 1 });
      (TimeSlotModel.findById as jest.Mock).mockResolvedValue(mockNewTimeSlot);
      (AppointmentModel.findAll as jest.Mock).mockResolvedValue([]);

      // Mock transaction queries
      mockConnection.query
        .mockResolvedValueOnce([[{ id: 1, patient_count: 1, capacity: 5, is_available: 0 }]]) // Old slot
        .mockResolvedValueOnce([[{ id: 2, patient_count: 0, capacity: 5, is_available: 1 }]]) // New slot
        .mockResolvedValueOnce([{}]) // Update old slot
        .mockResolvedValueOnce([{}]) // Update new slot
        .mockResolvedValueOnce([{}]); // Update appointment

      await appointmentController.rescheduleAppointment(mockReq as AuthRequest, mockRes as Response);

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Đổi lịch hẹn thành công'),
        })
      );
    });

    it('should rollback transaction on error', async () => {
      (AppointmentModel.findById as jest.Mock).mockResolvedValue(mockAppointment);
      (PatientModel.findByUserId as jest.Mock).mockResolvedValue({ id: 1 });
      (TimeSlotModel.findById as jest.Mock).mockResolvedValue(mockNewTimeSlot);
      (AppointmentModel.findAll as jest.Mock).mockResolvedValue([]);

      // Simulate error during transaction
      mockConnection.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(
        appointmentController.rescheduleAppointment(mockReq as AuthRequest, mockRes as Response)
      ).rejects.toThrow();

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.commit).not.toHaveBeenCalled();
    });
  });
});


