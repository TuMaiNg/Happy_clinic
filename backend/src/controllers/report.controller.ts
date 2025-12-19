import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import pool from '../config/database';

export const getAppointmentStats = async (req: AuthRequest, res: Response) => {
  if (!req.user || (req.user.role !== 'staff' && req.user.role !== 'admin')) {
    throw new AppError('Không có quyền truy cập', 403);
  }

  const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : new Date();
  const toDate = req.query.toDate ? new Date(req.query.toDate as string) : new Date();

  // Total appointments
  const [totalResult] = await pool.query(
    `SELECT COUNT(*) as total 
     FROM appointments 
     WHERE DATE(appointment_date) BETWEEN ? AND ?`,
    [fromDate, toDate]
  ) as any[];

  // By status
  const [statusResult] = await pool.query(
    `SELECT status, COUNT(*) as count 
     FROM appointments 
     WHERE DATE(appointment_date) BETWEEN ? AND ?
     GROUP BY status`,
    [fromDate, toDate]
  ) as any[];

  // By doctor
  const [doctorResult] = await pool.query(
    `SELECT d.full_name, d.speciality, COUNT(a.id) as count
     FROM appointments a
     JOIN doctors d ON a.doctor_id = d.id
     WHERE DATE(a.appointment_date) BETWEEN ? AND ?
     GROUP BY d.id, d.full_name, d.speciality
     ORDER BY count DESC`,
    [fromDate, toDate]
  ) as any[];

  // Daily stats
  const [dailyResult] = await pool.query(
    `SELECT DATE(appointment_date) as date, COUNT(*) as count
     FROM appointments
     WHERE DATE(appointment_date) BETWEEN ? AND ?
     GROUP BY DATE(appointment_date)
     ORDER BY date ASC`,
    [fromDate, toDate]
  ) as any[];

  res.json({
    success: true,
    data: {
      total: totalResult[0]?.total || 0,
      byStatus: statusResult,
      byDoctor: doctorResult,
      daily: dailyResult,
    },
  });
};

export const getRevenueStats = async (req: AuthRequest, res: Response) => {
  if (!req.user || (req.user.role !== 'staff' && req.user.role !== 'admin')) {
    throw new AppError('Không có quyền truy cập', 403);
  }

  const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : new Date();
  const toDate = req.query.toDate ? new Date(req.query.toDate as string) : new Date();

  // Total revenue
  const [totalResult] = await pool.query(
    `SELECT SUM(amount) as total 
     FROM payments 
     WHERE status = 'paid' AND DATE(paid_at) BETWEEN ? AND ?`,
    [fromDate, toDate]
  ) as any[];

  // By payment method
  const [methodResult] = await pool.query(
    `SELECT payment_method, SUM(amount) as total, COUNT(*) as count
     FROM payments
     WHERE status = 'paid' AND DATE(paid_at) BETWEEN ? AND ?
     GROUP BY payment_method`,
    [fromDate, toDate]
  ) as any[];

  // Daily revenue
  const [dailyResult] = await pool.query(
    `SELECT DATE(paid_at) as date, SUM(amount) as total, COUNT(*) as count
     FROM payments
     WHERE status = 'paid' AND DATE(paid_at) BETWEEN ? AND ?
     GROUP BY DATE(paid_at)
     ORDER BY date ASC`,
    [fromDate, toDate]
  ) as any[];

  // By service
  const [serviceResult] = await pool.query(
    `SELECT s.name, s.speciality, SUM(p.amount) as total, COUNT(p.id) as count
     FROM payments p
     JOIN appointments a ON p.appointment_id = a.id
     JOIN services s ON a.service_id = s.id
     WHERE p.status = 'paid' AND DATE(p.paid_at) BETWEEN ? AND ?
     GROUP BY s.id, s.name, s.speciality
     ORDER BY total DESC`,
    [fromDate, toDate]
  ) as any[];

  res.json({
    success: true,
    data: {
      total: parseFloat(totalResult[0]?.total || 0),
      byMethod: methodResult,
      daily: dailyResult,
      byService: serviceResult,
    },
  });
};

export const getDoctorPerformance = async (req: AuthRequest, res: Response) => {
  if (!req.user || (req.user.role !== 'staff' && req.user.role !== 'admin')) {
    throw new AppError('Không có quyền truy cập', 403);
  }

  const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : new Date();
  const toDate = req.query.toDate ? new Date(req.query.toDate as string) : new Date();

  const [result] = await pool.query(
    `SELECT 
       d.id,
       d.full_name,
       d.speciality,
       COUNT(a.id) as total_appointments,
       SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed,
       SUM(CASE WHEN a.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
       SUM(CASE WHEN a.status = 'no-show' THEN 1 ELSE 0 END) as no_show,
       ROUND(SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(a.id), 2) as completion_rate
     FROM doctors d
     LEFT JOIN appointments a ON d.id = a.doctor_id AND DATE(a.appointment_date) BETWEEN ? AND ?
     GROUP BY d.id, d.full_name, d.speciality
     ORDER BY total_appointments DESC`,
    [fromDate, toDate]
  ) as any[];

  res.json({
    success: true,
    data: result,
  });
};

export const getNoShowStats = async (req: AuthRequest, res: Response) => {
  if (!req.user || (req.user.role !== 'staff' && req.user.role !== 'admin')) {
    throw new AppError('Không có quyền truy cập', 403);
  }

  const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : new Date();
  const toDate = req.query.toDate ? new Date(req.query.toDate as string) : new Date();

  const [result] = await pool.query(
    `SELECT 
       DATE(a.appointment_date) as date,
       COUNT(*) as count,
       d.full_name as doctor_name,
       p.full_name as patient_name
     FROM appointments a
     JOIN doctors d ON a.doctor_id = d.id
     JOIN patients p ON a.patient_id = p.id
     WHERE a.status = 'no-show' AND DATE(a.appointment_date) BETWEEN ? AND ?
     GROUP BY DATE(a.appointment_date), d.id, d.full_name, p.id, p.full_name
     ORDER BY date DESC, count DESC`,
    [fromDate, toDate]
  ) as any[];

  res.json({
    success: true,
    data: result,
  });
};

/**
 * GET /api/reports/daily
 * Báo cáo chi tiết một ngày cho nhân viên
 * Bao gồm: danh sách bệnh nhân, tình trạng, hủy/chấp nhận lịch, hóa đơn
 */
export const getDailyReport = async (req: AuthRequest, res: Response) => {
  if (!req.user || (req.user.role !== 'staff' && req.user.role !== 'admin')) {
    throw new AppError('Không có quyền truy cập', 403);
  }

  // Lấy ngày từ query, mặc định là hôm nay
  const reportDate = req.query.date 
    ? new Date(req.query.date as string) 
    : new Date();
  
  // Đặt về đầu ngày (00:00:00)
  const startOfDay = new Date(reportDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  // Đặt về cuối ngày (23:59:59)
  const endOfDay = new Date(reportDate);
  endOfDay.setHours(23, 59, 59, 999);

  // 1. Lấy danh sách tất cả lịch hẹn trong ngày với thông tin chi tiết
  const [appointments] = await pool.query(
    `SELECT 
       a.id,
       a.appointment_date,
       a.start_time,
       a.end_time,
       a.status,
       a.symptoms,
       a.notes,
       a.visit_type,
       a.confirmed_at,
       a.cancelled_at,
       a.reason_cancel,
       a.cancellation_fee,
       a.checked_in_at,
       a.completed_at,
       p.id as patient_id,
       p.full_name as patient_name,
       p.phone as patient_phone,
       p.email as patient_email,
       p.gender as patient_gender,
       p.birthday as patient_birthday,
       d.id as doctor_id,
       d.full_name as doctor_name,
       d.speciality as doctor_speciality,
       s.id as service_id,
       s.name as service_name,
       s.price as service_price,
       u.email as user_email
     FROM appointments a
     JOIN patients p ON a.patient_id = p.id
     JOIN doctors d ON a.doctor_id = d.id
     JOIN services s ON a.service_id = s.id
     LEFT JOIN users u ON p.user_id = u.id
     WHERE DATE(a.appointment_date) = DATE(?)
     ORDER BY a.start_time ASC, a.created_at ASC`,
    [reportDate]
  ) as any[];

  // 2. Thống kê tổng quan
  const [stats] = await pool.query(
    `SELECT 
       COUNT(*) as total,
       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
       SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
       SUM(CASE WHEN status = 'no-show' THEN 1 ELSE 0 END) as no_show,
       SUM(CASE WHEN confirmed_at IS NOT NULL THEN 1 ELSE 0 END) as confirmed_count,
       SUM(CASE WHEN cancelled_at IS NOT NULL THEN 1 ELSE 0 END) as cancelled_count
     FROM appointments
     WHERE DATE(appointment_date) = DATE(?)`,
    [reportDate]
  ) as any[];

  // 3. Lấy thông tin thanh toán/hóa đơn cho các lịch hẹn trong ngày
  const [payments] = await pool.query(
    `SELECT 
       p.id,
       p.appointment_id,
       p.amount,
       p.payment_method,
       p.status as payment_status,
       p.transaction_id,
       p.paid_at,
       p.created_at as payment_created_at,
       a.status as appointment_status,
       a.appointment_date
     FROM payments p
     JOIN appointments a ON p.appointment_id = a.id
     WHERE DATE(a.appointment_date) = DATE(?)
     ORDER BY p.created_at ASC`,
    [reportDate]
  ) as any[];

  // 4. Tính tổng doanh thu
  const [revenue] = await pool.query(
    `SELECT 
       SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END) as total_revenue,
       SUM(CASE WHEN p.status = 'paid' AND p.payment_method = 'cash' THEN p.amount ELSE 0 END) as cash_revenue,
       SUM(CASE WHEN p.status = 'paid' AND p.payment_method = 'credit' THEN p.amount ELSE 0 END) as credit_revenue,
       SUM(CASE WHEN p.status = 'paid' AND p.payment_method = 'bank_transfer' THEN p.amount ELSE 0 END) as bank_revenue,
       SUM(CASE WHEN p.status = 'paid' AND p.payment_method = 'online' THEN p.amount ELSE 0 END) as online_revenue,
       COUNT(CASE WHEN p.status = 'paid' THEN 1 END) as paid_count,
       COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_payment_count
     FROM payments p
     JOIN appointments a ON p.appointment_id = a.id
     WHERE DATE(a.appointment_date) = DATE(?)`,
    [reportDate]
  ) as any[];

  // 5. Thống kê theo bác sĩ
  const [byDoctor] = await pool.query(
    `SELECT 
       d.id,
       d.full_name,
       d.speciality,
       COUNT(a.id) as total_appointments,
       SUM(CASE WHEN a.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
       SUM(CASE WHEN a.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
       SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed
     FROM doctors d
     LEFT JOIN appointments a ON d.id = a.doctor_id AND DATE(a.appointment_date) = DATE(?)
     WHERE a.id IS NOT NULL
     GROUP BY d.id, d.full_name, d.speciality
     ORDER BY total_appointments DESC`,
    [reportDate]
  ) as any[];

  // 6. Lịch hẹn bị hủy với lý do
  const [cancelledAppointments] = await pool.query(
    `SELECT 
       a.id,
       a.cancelled_at,
       a.reason_cancel,
       a.cancellation_fee,
       p.full_name as patient_name,
       p.phone as patient_phone,
       d.full_name as doctor_name,
       s.name as service_name
     FROM appointments a
     JOIN patients p ON a.patient_id = p.id
     JOIN doctors d ON a.doctor_id = d.id
     JOIN services s ON a.service_id = s.id
     WHERE DATE(a.appointment_date) = DATE(?) AND a.status = 'cancelled'
     ORDER BY a.cancelled_at DESC`,
    [reportDate]
  ) as any[];

  // 7. Lịch hẹn đã được chấp nhận/xác nhận
  const [confirmedAppointments] = await pool.query(
    `SELECT 
       a.id,
       a.confirmed_at,
       p.full_name as patient_name,
       p.phone as patient_phone,
       d.full_name as doctor_name,
       s.name as service_name,
       a.start_time
     FROM appointments a
     JOIN patients p ON a.patient_id = p.id
     JOIN doctors d ON a.doctor_id = d.id
     JOIN services s ON a.service_id = s.id
     WHERE DATE(a.appointment_date) = DATE(?) AND a.status = 'confirmed'
     ORDER BY a.confirmed_at DESC`,
    [reportDate]
  ) as any[];

  res.json({
    success: true,
    data: {
      date: reportDate.toISOString().split('T')[0],
      summary: {
        total: stats[0]?.total || 0,
        pending: stats[0]?.pending || 0,
        confirmed: stats[0]?.confirmed || 0,
        cancelled: stats[0]?.cancelled || 0,
        completed: stats[0]?.completed || 0,
        noShow: stats[0]?.no_show || 0,
        confirmedCount: stats[0]?.confirmed_count || 0,
        cancelledCount: stats[0]?.cancelled_count || 0,
      },
      revenue: {
        total: parseFloat(revenue[0]?.total_revenue || 0),
        cash: parseFloat(revenue[0]?.cash_revenue || 0),
        credit: parseFloat(revenue[0]?.credit_revenue || 0),
        bankTransfer: parseFloat(revenue[0]?.bank_revenue || 0),
        online: parseFloat(revenue[0]?.online_revenue || 0),
        paidCount: revenue[0]?.paid_count || 0,
        pendingPaymentCount: revenue[0]?.pending_payment_count || 0,
      },
      appointments: appointments.map((apt: any) => ({
        id: apt.id,
        appointmentDate: apt.appointment_date,
        startTime: apt.start_time,
        endTime: apt.end_time,
        status: apt.status,
        symptoms: apt.symptoms,
        notes: apt.notes,
        visitType: apt.visit_type,
        confirmedAt: apt.confirmed_at,
        cancelledAt: apt.cancelled_at,
        reasonCancel: apt.reason_cancel,
        cancellationFee: apt.cancellation_fee,
        checkedInAt: apt.checked_in_at,
        completedAt: apt.completed_at,
        patient: {
          id: apt.patient_id,
          name: apt.patient_name,
          phone: apt.patient_phone,
          email: apt.patient_email || apt.user_email,
          gender: apt.patient_gender,
          birthday: apt.patient_birthday,
        },
        doctor: {
          id: apt.doctor_id,
          name: apt.doctor_name,
          speciality: apt.doctor_speciality,
        },
        service: {
          id: apt.service_id,
          name: apt.service_name,
          price: apt.service_price,
        },
      })),
      payments: payments.map((pay: any) => ({
        id: pay.id,
        appointmentId: pay.appointment_id,
        amount: pay.amount,
        paymentMethod: pay.payment_method,
        status: pay.payment_status,
        transactionId: pay.transaction_id,
        paidAt: pay.paid_at,
        createdAt: pay.payment_created_at,
        appointmentStatus: pay.appointment_status,
      })),
      byDoctor: byDoctor,
      cancelledAppointments: cancelledAppointments,
      confirmedAppointments: confirmedAppointments,
    },
  });
};

