import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { otpService } from '../services/otp.service';
import { AppointmentModel } from '../models/Appointment';
import { notificationService } from '../services/notification.service';
import pool from '../config/database';

/**
 * POST /api/appointments/:id/verify-otp
 * Verify OTP and confirm appointment
 */
export const verifyOTP = async (req: AuthRequest, res: Response): Promise<void> => {
  const appointmentId = parseInt(req.params.id);
  const { otp } = req.body;

  if (!otp || otp.length !== 6) {
    throw new AppError('Vui lòng nhập mã OTP 6 số', 400);
  }

  // Get appointment
  const appointment = await AppointmentModel.findById(appointmentId);
  if (!appointment) {
    throw new AppError('Không tìm thấy lịch hẹn', 404);
  }

  // Check if already confirmed
  if (appointment.status === 'confirmed') {
    res.json({
      success: true,
      verified: true,
      message: 'Lịch hẹn đã được xác nhận trước đó',
    });
    return;
  }

  // Verify OTP
  const result = await otpService.verifyOTP(appointmentId, otp);

  if (!result.verified) {
    res.status(400).json({
      success: false,
      verified: false,
      error: result.error,
    });
    return;
  }

  // OTP verified → Confirm appointment
  await pool.query(
    `UPDATE appointments 
     SET status = 'confirmed', confirmed_at = NOW() 
     WHERE id = ?`,
    [appointmentId]
  );

  // Send confirmation notification
  try {
    await notificationService.sendAppointmentConfirmation(appointmentId);
  } catch (error) {
    console.error('Failed to send confirmation notification:', error);
  }

  // Get updated appointment details
  const confirmedAppointment = await AppointmentModel.findById(appointmentId);

  res.json({
    success: true,
    verified: true,
    message: 'Xác nhận thành công! Lịch hẹn đã được đặt.',
    data: confirmedAppointment,
  });
};

/**
 * POST /api/appointments/:id/resend-otp
 * Resend OTP code
 */
export const resendOTP = async (req: AuthRequest, res: Response): Promise<void> => {
  const appointmentId = parseInt(req.params.id);

  // Get appointment and patient info
  const [rows] = await pool.query(
    `SELECT a.*, p.phone, p.full_name
     FROM appointments a
     JOIN patients p ON a.patient_id = p.id
     WHERE a.id = ?`,
    [appointmentId]
  ) as any[];

  if (rows.length === 0) {
    throw new AppError('Không tìm thấy lịch hẹn', 404);
  }

  const appointment = rows[0];

  // Check if already confirmed
  if (appointment.status === 'confirmed') {
    throw new AppError('Lịch hẹn đã được xác nhận', 400);
  }

  // Resend OTP
  const result = await otpService.resendOTP(appointmentId, appointment.phone);

  if (!result.sent) {
    res.status(429).json({
      success: false,
      error: result.error,
    });
    return;
  }

  res.json({
    success: true,
    message: 'Đã gửi lại mã OTP',
    phone: otpService.maskPhone(appointment.phone),
    expiresIn: 300,
  });
};

/**
 * GET /api/appointments/:id/otp-status
 * Get OTP verification status
 */
export const getOTPStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const appointmentId = parseInt(req.params.id);

  const appointment = await AppointmentModel.findById(appointmentId);
  if (!appointment) {
    throw new AppError('Không tìm thấy lịch hẹn', 404);
  }

  const stats = await otpService.getOTPStats(appointmentId);
  const activeOTP = await otpService.getActiveOTP(appointmentId);

  res.json({
    success: true,
    data: {
      appointmentId,
      status: appointment.status,
      verified: stats.verified || appointment.status === 'confirmed',
      expired: stats.expired,
      hasActiveOTP: activeOTP !== null,
      attempts: stats.totalAttempts,
      maxAttempts: 3,
    },
  });
};



