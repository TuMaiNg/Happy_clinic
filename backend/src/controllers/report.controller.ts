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

