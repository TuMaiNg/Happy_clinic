import { createAppointment, cancelAppointment, checkInAppointment } from '../../controllers/appointment.controller';
import { AppointmentModel } from '../../models/Appointment';
import { TimeSlotModel } from '../../models/TimeSlot';
import { ServiceModel } from '../../models/Service';
import { PatientModel } from '../../models/Patient';
import { config } from '../../config/env';
import { differenceInHours } from 'date-fns';

// Mock dependencies
jest.mock('../../models/Appointment');
jest.mock('../../models/TimeSlot');
jest.mock('../../models/Service');
jest.mock('../../models/Patient');
jest.mock('../../services/socket.service');
jest.mock('../../services/email.service');
jest.mock('../../config/database');

describe('Appointment Controller', () => {
  const mockRequest = {
    user: { id: 1, role: 'patient' },
    body: {},
  } as any;

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAppointment', () => {
    it('should create appointment with valid data', async () => {
      const appointmentDate = new Date();
      appointmentDate.setHours(appointmentDate.getHours() + 3); // 3 hours ahead

      mockRequest.body = {
        doctorId: 1,
        serviceId: 1,
        slotId: 1,
        appointmentDate: appointmentDate.toISOString(),
        visitType: 'first-visit',
        symptoms: 'Sốt cao',
      };

      const mockTimeSlot = {
        id: 1,
        scheduleId: 1,
        startTime: '08:00:00',
        endTime: '08:30:00',
        isAvailable: true,
        patientCount: 0,
        capacity: 3,
      };

      const mockService = {
        id: 1,
        name: 'Khám tổng quát',
        price: 200000,
        isActive: true,
      };

      const mockPatient = {
        id: 1,
        userId: 1,
        fullName: 'Nguyễn Văn A',
      };

      const mockAppointment = {
        id: 1,
        patientId: 1,
        doctorId: 1,
        serviceId: 1,
        status: 'pending',
      };

      (TimeSlotModel.findById as jest.Mock).mockResolvedValue(mockTimeSlot);
      (ServiceModel.findById as jest.Mock).mockResolvedValue(mockService);
      (PatientModel.findByUserId as jest.Mock).mockResolvedValue(mockPatient);
      (AppointmentModel.findAll as jest.Mock).mockResolvedValue([]);
      (AppointmentModel.create as jest.Mock).mockResolvedValue(mockAppointment);
      (TimeSlotModel.incrementPatientCount as jest.Mock).mockResolvedValue(undefined);

      // Mock pool.query for patient/doctor lookup
      const pool = require('../../config/database').default;
      pool.query = jest.fn().mockResolvedValue([[]]);

      await createAppointment(mockRequest, mockResponse);

      expect(AppointmentModel.create).toHaveBeenCalled();
      expect(TimeSlotModel.incrementPatientCount).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should reject booking within 2-hour lead time', async () => {
      const appointmentDate = new Date();
      appointmentDate.setHours(appointmentDate.getHours() + 1); // Only 1 hour ahead

      mockRequest.body = {
        doctorId: 1,
        serviceId: 1,
        slotId: 1,
        appointmentDate: appointmentDate.toISOString(),
        visitType: 'first-visit',
      };

      const mockPatient = {
        id: 1,
        userId: 1,
      };

      (PatientModel.findByUserId as jest.Mock).mockResolvedValue(mockPatient);

      await expect(createAppointment(mockRequest, mockResponse)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('tối thiểu'),
        })
      );
    });

    it('should reject booking when slot is full', async () => {
      const appointmentDate = new Date();
      appointmentDate.setHours(appointmentDate.getHours() + 3);

      mockRequest.body = {
        doctorId: 1,
        serviceId: 1,
        slotId: 1,
        appointmentDate: appointmentDate.toISOString(),
        visitType: 'first-visit',
      };

      const mockTimeSlot = {
        id: 1,
        isAvailable: true,
        patientCount: 3,
        capacity: 3, // Full
      };

      const mockPatient = {
        id: 1,
        userId: 1,
      };

      (PatientModel.findByUserId as jest.Mock).mockResolvedValue(mockPatient);
      (TimeSlotModel.findById as jest.Mock).mockResolvedValue(mockTimeSlot);

      await expect(createAppointment(mockRequest, mockResponse)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('hết chỗ'),
        })
      );
    });

    it('should reject duplicate booking', async () => {
      const appointmentDate = new Date();
      appointmentDate.setHours(appointmentDate.getHours() + 3);

      mockRequest.body = {
        doctorId: 1,
        serviceId: 1,
        slotId: 1,
        appointmentDate: appointmentDate.toISOString(),
        visitType: 'first-visit',
      };

      const mockTimeSlot = {
        id: 1,
        scheduleId: 1,
        startTime: '08:00:00',
        endTime: '08:30:00',
        isAvailable: true,
        patientCount: 0,
        capacity: 3,
      };

      const mockService = {
        id: 1,
        isActive: true,
      };

      const mockPatient = {
        id: 1,
        userId: 1,
      };

      const existingAppointment = {
        id: 1,
        patientId: 1,
        doctorId: 1,
        slotId: 1,
        appointmentDate: appointmentDate,
        status: 'confirmed',
      };

      (PatientModel.findByUserId as jest.Mock).mockResolvedValue(mockPatient);
      (TimeSlotModel.findById as jest.Mock).mockResolvedValue(mockTimeSlot);
      (ServiceModel.findById as jest.Mock).mockResolvedValue(mockService);
      (AppointmentModel.findAll as jest.Mock).mockResolvedValue([existingAppointment]);

      await expect(createAppointment(mockRequest, mockResponse)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('đã có lịch hẹn'),
        })
      );
    });
  });

  describe('cancelAppointment', () => {
    it('should calculate 20% cancellation fee for late cancels', async () => {
      const appointmentDate = new Date();
      appointmentDate.setHours(appointmentDate.getHours() + 12); // 12 hours ahead (< 24h)

      const mockAppointment = {
        id: 1,
        patientId: 1,
        doctorId: 1,
        serviceId: 1,
        slotId: 1,
        appointmentDate: appointmentDate,
        status: 'confirmed',
      };

      const mockService = {
        id: 1,
        price: 200000,
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { reason: 'Bận việc' };

      (AppointmentModel.findById as jest.Mock).mockResolvedValue(mockAppointment);
      (ServiceModel.findById as jest.Mock).mockResolvedValue(mockService);
      (AppointmentModel.update as jest.Mock).mockResolvedValue({
        ...mockAppointment,
        status: 'cancelled',
        cancellationFee: 40000,
      });
      (TimeSlotModel.decrementPatientCount as jest.Mock).mockResolvedValue(undefined);

      // Mock pool.query
      const pool = require('../../config/database').default;
      pool.query = jest.fn().mockResolvedValue([[]]);

      await cancelAppointment(mockRequest, mockResponse);

      expect(AppointmentModel.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: 'cancelled',
          cancellationFee: 40000, // 20% of 200000
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          cancellationFee: 40000,
        })
      );
    });

    it('should not charge fee for early cancellation', async () => {
      const appointmentDate = new Date();
      appointmentDate.setHours(appointmentDate.getHours() + 48); // 48 hours ahead (> 24h)

      const mockAppointment = {
        id: 1,
        patientId: 1,
        doctorId: 1,
        serviceId: 1,
        slotId: 1,
        appointmentDate: appointmentDate,
        status: 'confirmed',
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { reason: 'Có việc đột xuất' };

      (AppointmentModel.findById as jest.Mock).mockResolvedValue(mockAppointment);
      (AppointmentModel.update as jest.Mock).mockResolvedValue({
        ...mockAppointment,
        status: 'cancelled',
        cancellationFee: 0,
      });
      (TimeSlotModel.decrementPatientCount as jest.Mock).mockResolvedValue(undefined);

      // Mock pool.query
      const pool = require('../../config/database').default;
      pool.query = jest.fn().mockResolvedValue([[]]);

      await cancelAppointment(mockRequest, mockResponse);

      expect(AppointmentModel.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: 'cancelled',
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          cancellationFee: undefined,
        })
      );
    });

    it('should reject cancellation for non-cancellable status', async () => {
      const mockAppointment = {
        id: 1,
        patientId: 1,
        status: 'completed', // Cannot cancel completed appointment
      };

      mockRequest.params = { id: '1' };
      (AppointmentModel.findById as jest.Mock).mockResolvedValue(mockAppointment);
      (PatientModel.findByUserId as jest.Mock).mockResolvedValue({ id: 1 }); // Mock patient matching

      await expect(cancelAppointment(mockRequest, mockResponse)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('không thể hủy'),
        })
      );
    });
  });

  describe('checkInAppointment', () => {
    it('should check in confirmed appointment', async () => {
      const mockAppointment = {
        id: 1,
        status: 'confirmed',
      };

      mockRequest.params = { id: '1' };
      (AppointmentModel.findById as jest.Mock).mockResolvedValue(mockAppointment);
      (AppointmentModel.update as jest.Mock).mockResolvedValue({
        ...mockAppointment,
        status: 'checked-in',
      });

      await checkInAppointment(mockRequest, mockResponse);

      expect(AppointmentModel.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: 'checked-in',
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('should reject check-in for non-confirmed appointment', async () => {
      const mockAppointment = {
        id: 1,
        status: 'pending', // Must be confirmed first
      };

      mockRequest.params = { id: '1' };
      (AppointmentModel.findById as jest.Mock).mockResolvedValue(mockAppointment);

      await expect(checkInAppointment(mockRequest, mockResponse)).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('xác nhận'),
        })
      );
    });
  });
});








