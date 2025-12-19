import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PaymentModel } from '../models/Payment';
import { AppointmentModel } from '../models/Appointment';
import { ServiceModel } from '../models/Service';
import { AppError } from '../middleware/errorHandler';
import { emitNotification } from '../services/socket.service';

export const createPayment = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Không có quyền truy cập', 403);
  }

  const { appointmentId, paymentMethod, amount, notes } = req.body;

  if (!appointmentId || !paymentMethod) {
    throw new AppError('Vui lòng điền đầy đủ thông tin', 400);
  }

  // Get appointment
  const appointment = await AppointmentModel.findById(appointmentId);
  if (!appointment) {
    throw new AppError('Không tìm thấy lịch hẹn', 404);
  }

  // Check authorization
  if (req.user.role === 'patient') {
    const { PatientModel } = await import('../models/Patient');
    const patient = await PatientModel.findByUserId(req.user.id);
    if (patient?.id !== appointment.patientId) {
      throw new AppError('Không có quyền thanh toán cho lịch hẹn này', 403);
    }
  }

  // Get service to verify amount
  const service = await ServiceModel.findById(appointment.serviceId);
  if (!service) {
    throw new AppError('Không tìm thấy dịch vụ', 404);
  }

  // Use provided amount or service price
  const paymentAmount = amount || service.price;

  // Check if payment already exists
  const existingPayments = await PaymentModel.findByAppointment(appointmentId);
  const paidAmount = existingPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  if (paidAmount >= service.price && !amount) {
    throw new AppError('Lịch hẹn này đã được thanh toán đầy đủ', 400);
  }

  // Create payment
  // Tất cả payment đều bắt đầu với status 'pending'
  // Status sẽ được cập nhật bởi payment gateway (webhook) hoặc staff (confirmPayment)
  const payment = await PaymentModel.create({
    appointmentId,
    amount: paymentAmount,
    paymentMethod,
    status: 'pending',
    notes: notes || null,
  });

  res.status(201).json({
    success: true,
    message: 'Tạo thanh toán thành công',
    data: payment,
  });
};

export const getPayments = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Không có quyền truy cập', 403);
  }

  const filters: any = {
    limit: parseInt(req.query.limit as string) || 50,
    offset: parseInt(req.query.offset as string) || 0,
  };

  // Role-based filtering
  if (req.user.role === 'patient') {
    const { PatientModel } = await import('../models/Patient');
    const patient = await PatientModel.findByUserId(req.user.id);
    if (!patient) {
      throw new AppError('Không tìm thấy thông tin bệnh nhân', 404);
    }
    filters.patientId = patient.id;
  }

  if (req.query.status) {
    filters.status = req.query.status;
  }
  if (req.query.fromDate) {
    filters.fromDate = new Date(req.query.fromDate as string);
  }
  if (req.query.toDate) {
    filters.toDate = new Date(req.query.toDate as string);
  }

  const payments = await PaymentModel.findAll(filters);

  res.json({
    success: true,
    data: payments,
  });
};

export const getPaymentById = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Không có quyền truy cập', 403);
  }

  const paymentId = parseInt(req.params.id);
  const payment = await PaymentModel.findById(paymentId);

  if (!payment) {
    throw new AppError('Không tìm thấy thanh toán', 404);
  }

  // Check authorization
  if (req.user.role === 'patient') {
    const { PatientModel } = await import('../models/Patient');
    const patient = await PatientModel.findByUserId(req.user.id);
    const appointment = await AppointmentModel.findById(payment.appointmentId);
    if (patient?.id !== appointment?.patientId) {
      throw new AppError('Không có quyền truy cập', 403);
    }
  }

  res.json({
    success: true,
    data: payment,
  });
};

export const confirmPayment = async (req: AuthRequest, res: Response) => {
  if (!req.user || (req.user.role !== 'staff' && req.user.role !== 'admin')) {
    throw new AppError('Chỉ nhân viên mới có thể xác nhận thanh toán', 403);
  }

  const paymentId = parseInt(req.params.id);
  const payment = await PaymentModel.findById(paymentId);

  if (!payment) {
    throw new AppError('Không tìm thấy thanh toán', 404);
  }

  if (payment.status !== 'pending') {
    throw new AppError('Thanh toán này không thể xác nhận', 400);
  }

  const updated = await PaymentModel.update(paymentId, {
    status: 'paid',
    paidAt: new Date(),
    transactionId: req.body.transactionId || `TXN-${Date.now()}`,
  });

  // Get appointment and patient info for notification
  const appointment = await AppointmentModel.findById(payment.appointmentId);
  if (appointment) {
    const [patientRows] = await (await import('../config/database')).default.query(
      'SELECT p.*, u.id as user_id, u.email FROM patients p LEFT JOIN users u ON p.user_id = u.id WHERE p.id = ?',
      [appointment.patientId]
    ) as any[];
    const patient = patientRows?.[0];

    if (patient && patient.user_id) {
      emitNotification(patient.user_id, {
        type: 'payment',
        title: 'Thanh toán đã được xác nhận',
        message: `Thanh toán ${payment.amount.toLocaleString('vi-VN')} VNĐ đã được xác nhận.`,
      });
    }
  }

  res.json({
    success: true,
    message: 'Xác nhận thanh toán thành công',
    data: updated,
  });
};

