import { Request, Response } from 'express';
import * as otpController from '../../controllers/otp.controller';
import { otpService } from '../../services/otp.service';
import { AppointmentModel } from '../../models/Appointment';
import { notificationService } from '../../services/notification.service';
import pool from '../../config/database';

// Mock dependencies
jest.mock('../../services/otp.service');
jest.mock('../../models/Appointment');
jest.mock('../../services/notification.service');
jest.mock('../../config/database');

describe('OTP Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      params: {},
      body: {},
      user: { id: 1, role: 'patient' },
    };

    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('verifyOTP', () => {
    it('should verify OTP and confirm appointment', async () => {
      const appointmentId = 123;
      const otp = '123456';
      
      mockRequest.params = { id: appointmentId.toString() };
      mockRequest.body = { otp };

      const mockAppointment = {
        id: appointmentId,
        status: 'pending',
        patientId: 1,
        doctorId: 1,
      };

      (AppointmentModel.findById as jest.Mock).mockResolvedValue(mockAppointment);
      (otpService.verifyOTP as jest.Mock).mockResolvedValue({ verified: true });
      (pool.query as jest.Mock).mockResolvedValue([{ affectedRows: 1 }]);
      (notificationService.sendAppointmentConfirmation as jest.Mock).mockResolvedValue(true);
      (AppointmentModel.findById as jest.Mock).mockResolvedValueOnce(mockAppointment).mockResolvedValueOnce({
        ...mockAppointment,
        status: 'confirmed',
      });

      await otpController.verifyOTP(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(otpService.verifyOTP).toHaveBeenCalledWith(appointmentId, otp);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          verified: true,
        })
      );
    });

    it('should reject invalid OTP', async () => {
      const appointmentId = 123;
      const otp = '123456';
      
      mockRequest.params = { id: appointmentId.toString() };
      mockRequest.body = { otp };

      const mockAppointment = {
        id: appointmentId,
        status: 'pending',
      };

      (AppointmentModel.findById as jest.Mock).mockResolvedValue(mockAppointment);
      (otpService.verifyOTP as jest.Mock).mockResolvedValue({
        verified: false,
        error: 'Mã không đúng',
      });

      await otpController.verifyOTP(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          verified: false,
          error: 'Mã không đúng',
        })
      );
    });

    it('should reject OTP with wrong length', async () => {
      mockRequest.params = { id: '123' };
      mockRequest.body = { otp: '12345' }; // 5 digits instead of 6

      await expect(
        otpController.verifyOTP(
          mockRequest as any,
          mockResponse as Response,
          mockNext
        )
      ).rejects.toThrow('Vui lòng nhập mã OTP 6 số');
    });

    it('should handle already confirmed appointment', async () => {
      const appointmentId = 123;
      const otp = '123456';
      
      mockRequest.params = { id: appointmentId.toString() };
      mockRequest.body = { otp };

      const mockAppointment = {
        id: appointmentId,
        status: 'confirmed', // Already confirmed
      };

      (AppointmentModel.findById as jest.Mock).mockResolvedValue(mockAppointment);

      await otpController.verifyOTP(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          verified: true,
          message: expect.stringContaining('đã được xác nhận'),
        })
      );
    });
  });

  describe('resendOTP', () => {
    it('should resend OTP successfully', async () => {
      const appointmentId = 123;
      mockRequest.params = { id: appointmentId.toString() };

      const mockAppointment = {
        id: appointmentId,
        status: 'pending',
        phone: '0912345678',
      };

      (pool.query as jest.Mock).mockResolvedValueOnce([mockAppointment]);
      (otpService.resendOTP as jest.Mock).mockResolvedValue({
        sent: true,
        otp: '654321',
      });
      (otpService.maskPhone as jest.Mock).mockReturnValue('09XX***678');

      await otpController.resendOTP(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(otpService.resendOTP).toHaveBeenCalledWith(appointmentId, mockAppointment.phone);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Đã gửi lại mã OTP',
        })
      );
    });

    it('should handle rate limit error', async () => {
      const appointmentId = 123;
      mockRequest.params = { id: appointmentId.toString() };

      const mockAppointment = {
        id: appointmentId,
        status: 'pending',
        phone: '0912345678',
      };

      (pool.query as jest.Mock).mockResolvedValueOnce([mockAppointment]);
      (otpService.resendOTP as jest.Mock).mockResolvedValue({
        sent: false,
        error: 'Vui lòng đợi 30 giây',
      });

      await otpController.resendOTP(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Vui lòng đợi 30 giây',
        })
      );
    });

    it('should reject resend for confirmed appointment', async () => {
      const appointmentId = 123;
      mockRequest.params = { id: appointmentId.toString() };

      const mockAppointment = {
        id: appointmentId,
        status: 'confirmed', // Already confirmed
        phone: '0912345678',
      };

      (pool.query as jest.Mock).mockResolvedValueOnce([mockAppointment]);

      await expect(
        otpController.resendOTP(
          mockRequest as any,
          mockResponse as Response,
          mockNext
        )
      ).rejects.toThrow('đã được xác nhận');
    });
  });

  describe('getOTPStatus', () => {
    it('should return OTP status', async () => {
      const appointmentId = 123;
      mockRequest.params = { id: appointmentId.toString() };

      const mockAppointment = {
        id: appointmentId,
        status: 'pending',
      };

      (AppointmentModel.findById as jest.Mock).mockResolvedValue(mockAppointment);
      (otpService.getOTPStats as jest.Mock).mockResolvedValue({
        totalAttempts: 1,
        verified: false,
        expired: false,
      });
      (otpService.getActiveOTP as jest.Mock).mockResolvedValue({
        id: 1,
        otpCode: '123456',
      });

      await otpController.getOTPStatus(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            appointmentId,
            status: 'pending',
          }),
        })
      );
    });
  });
});


