import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppointmentModel } from '../models/Appointment';
import { TimeSlotModel } from '../models/TimeSlot';
import { ServiceModel } from '../models/Service';
import { PatientModel } from '../models/Patient';
import { DoctorModel } from '../models/Doctor';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config/env';
import { emitNotification } from '../services/socket.service';
import { emailService } from '../services/email.service';
import pool from '../config/database';
import { differenceInHours, format } from 'date-fns';

export const createAppointment = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Không có quyền truy cập', 403);
  }

  const { doctorId, serviceId, slotId, appointmentDate, visitType, symptoms } = req.body;

  if (!doctorId || !serviceId || !slotId || !appointmentDate || !visitType) {
    throw new AppError('Vui lòng điền đầy đủ thông tin', 400);
  }

  // Get patient ID
  let patientId: number;
  if (req.user.role === 'patient') {
    const patient = await PatientModel.findByUserId(req.user.id);
    if (!patient) {
      throw new AppError('Không tìm thấy thông tin bệnh nhân', 404);
    }
    patientId = patient.id!;
  } else {
    if (!req.body.patientId) {
      throw new AppError('Vui lòng chọn bệnh nhân', 400);
    }
    patientId = req.body.patientId;
  }

  // Check lead time
  const appointmentDateTime = new Date(appointmentDate);
  const now = new Date();
  const hoursUntilAppointment = differenceInHours(appointmentDateTime, now);

  if (hoursUntilAppointment < config.businessRules.minLeadTimeHours) {
    throw new AppError(
      `Bạn chỉ có thể đặt lịch tối thiểu ${config.businessRules.minLeadTimeHours} giờ trước`,
      400
    );
  }

  // Check max booking ahead
  const daysUntilAppointment = hoursUntilAppointment / 24;
  if (daysUntilAppointment > config.businessRules.maxBookingDaysAhead) {
    throw new AppError(
      `Bạn chỉ có thể đặt lịch tối đa ${config.businessRules.maxBookingDaysAhead} ngày trước`,
      400
    );
  }

  // Verify time slot
  const timeSlot = await TimeSlotModel.findById(slotId);
  if (!timeSlot) {
    throw new AppError('Không tìm thấy khung giờ', 404);
  }

  if (!timeSlot.isAvailable || timeSlot.patientCount >= timeSlot.capacity) {
    throw new AppError('Khung giờ này đã hết chỗ. Vui lòng chọn khung giờ khác.', 409);
  }

  // Verify service
  const service = await ServiceModel.findById(serviceId);
  if (!service || !service.isActive) {
    throw new AppError('Dịch vụ không tồn tại hoặc đã bị vô hiệu hóa', 404);
  }

  // Check for duplicates (exclude cancelled, no-show, and expired pending appointments)
  const existingAppointments = await AppointmentModel.findAll({ patientId, doctorId });
  const duplicateCheckDateStr = appointmentDate.split('T')[0];
  const currentTime = new Date();
  
  const hasDuplicate = existingAppointments.some(apt => {
    const aptDateStr = new Date(apt.appointmentDate).toISOString().split('T')[0];
    const aptDateTime = new Date(apt.appointmentDate);
    
    // Skip cancelled and no-show
    if (apt.status === 'cancelled' || apt.status === 'no-show') {
      return false;
    }
    
    // Skip expired pending appointments (older than 10 minutes without OTP verification)
    if (apt.status === 'pending') {
      const pendingAge = (currentTime.getTime() - aptDateTime.getTime()) / 1000 / 60; // minutes
      if (pendingAge > 10) {
        return false; // Expired pending, allow new booking
      }
    }
    
    // Check if same date and slot
    return (
      aptDateStr === duplicateCheckDateStr &&
      apt.slotId === slotId
    );
  });

  if (hasDuplicate) {
    throw new AppError('Bạn đã có lịch hẹn vào khung giờ này. Vui lòng chọn khung giờ khác hoặc hủy lịch hẹn cũ trước.', 409);
  }

  // Create appointment with PENDING status (waiting for staff confirmation)
  const appointment = await AppointmentModel.create({
    patientId,
    doctorId,
    serviceId,
    slotId,
    scheduleId: timeSlot.scheduleId,
    appointmentDate: appointmentDateTime,
    startTime: timeSlot.startTime,
    endTime: timeSlot.endTime,
    visitType,
    symptoms: symptoms || null,
    status: 'pending',
  });

  // Increment time slot
  await TimeSlotModel.incrementPatientCount(slotId);

  // Get patient and doctor info
  const [patientRows] = await pool.query(
    'SELECT p.*, u.email, u.id as user_id FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = ?',
    [patientId]
  ) as any[];
  const patient = patientRows[0];

  const [doctorRows] = await pool.query(
    'SELECT * FROM doctors WHERE id = ?',
    [doctorId]
  ) as any[];
  const doctor = doctorRows[0];

  if (!appointment.id) {
    throw new AppError('Không thể tạo lịch hẹn', 500);
  }

  // Get full appointment details for notifications
  const fullAppointment = await AppointmentModel.findById(appointment.id);

  // Notify STAFF about new pending appointment
  try {
    const { notificationService } = await import('../services/notification.service');
    await notificationService.notifyStaff({
      type: 'new_appointment_pending',
      title: 'Lịch hẹn mới cần xác nhận',
      message: `Bệnh nhân ${patient.full_name} đặt lịch khám với ${doctor.full_name}`,
      appointmentId: appointment.id,
      priority: 'high',
    });
  } catch (error: any) {
    console.error('Error notifying staff:', error);
    // Don't fail the request if notification fails
  }

  // Send simple booking received email to patient (not confirmation yet)
  try {
    if (patient.email) {
      await emailService.sendBookingReceived({
        to: patient.email,
        patientName: patient.full_name,
        appointmentId: appointment.id,
        message: 'Lịch hẹn của bạn đang chờ xác nhận. Chúng tôi sẽ liên hệ trong vòng 2 giờ.',
      });
    }
  } catch (error: any) {
    console.error('Error sending booking received email:', error);
    // Don't fail the request if email fails
  }

  res.status(201).json({
    success: true,
    message: 'Đặt lịch thành công! Chúng tôi sẽ liên hệ xác nhận trong 2 giờ tới.',
    data: {
      id: appointment.id,
      ...fullAppointment,
    },
  });
};

// Keep old email confirmation code commented for reference
// Email confirmation is now sent after OTP verification in otp.controller.ts

export const getAppointments = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Không có quyền truy cập', 403);
  }

  const filters: any = {
    limit: parseInt(req.query.limit as string) || 50,
    offset: parseInt(req.query.offset as string) || 0,
  };

  if (req.user.role === 'patient') {
    const patient = await PatientModel.findByUserId(req.user.id);
    if (!patient) {
      throw new AppError('Không tìm thấy thông tin bệnh nhân', 404);
    }
    filters.patientId = patient.id;
  } else if (req.user.role === 'doctor') {
    const doctor = await DoctorModel.findByUserId(req.user.id);
    if (!doctor) {
      throw new AppError('Không tìm thấy thông tin bác sĩ', 404);
    }
    filters.doctorId = doctor.id;
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

  const appointments = await AppointmentModel.findAll(filters);
  res.json({ success: true, data: appointments });
};

export const getAppointmentById = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Không có quyền truy cập', 403);
  }

  const appointmentId = parseInt(req.params.id);
  const appointment = await AppointmentModel.findById(appointmentId);

  if (!appointment) {
    throw new AppError('Không tìm thấy lịch hẹn', 404);
  }

  // Kiểm tra quyền xem lịch hẹn
  const userRole = req.user.role;
  const isStaffOrAdmin = ['staff', 'admin'].includes(userRole);

  if (!isStaffOrAdmin) {
    if (userRole === 'patient') {
      const patient = await PatientModel.findByUserId(req.user.id);
      if (!patient || patient.id !== appointment.patientId) {
        throw new AppError('Bạn không có quyền xem lịch hẹn này', 403);
      }
    } else if (userRole === 'doctor') {
      const doctor = await DoctorModel.findByUserId(req.user.id);
      if (!doctor || doctor.id !== appointment.doctorId) {
        throw new AppError('Bạn không có quyền xem lịch hẹn này', 403);
      }
    }
  }

  res.json({ success: true, data: appointment });
};

export const confirmAppointment = async (req: AuthRequest, res: Response) => {
  if (!req.user || (req.user.role !== 'staff' && req.user.role !== 'admin')) {
    throw new AppError('Chỉ nhân viên mới có thể xác nhận lịch hẹn', 403);
  }

  const appointmentId = parseInt(req.params.id);
  const appointment = await AppointmentModel.findById(appointmentId);

  if (!appointment) {
    throw new AppError('Không tìm thấy lịch hẹn', 404);
  }

  if (appointment.status !== 'pending') {
    throw new AppError('Lịch hẹn này không thể xác nhận', 400);
  }

  const updated = await AppointmentModel.update(appointmentId, {
    status: 'confirmed',
    confirmedBy: req.user.id,
    confirmedAt: new Date(),
  });

  // Get appointment details for email
  const [appointmentDetails] = await pool.query(
    `SELECT a.*, 
            p.full_name as patient_name, p.phone as patient_phone,
            d.full_name as doctor_name, d.specialty,
            s.name as service_name, s.price as service_price,
            u.email as patient_email
     FROM appointments a
     JOIN patients p ON a.patient_id = p.id
     JOIN doctors d ON a.doctor_id = d.id
     JOIN services s ON a.service_id = s.id
     JOIN users u ON p.user_id = u.id
     WHERE a.id = ?`,
    [appointmentId]
  ) as any[];
  
  const aptDetails = appointmentDetails[0];

  // Send confirmation email to patient
  try {
    if (aptDetails.patient_email) {
      await emailService.sendAppointmentConfirmation({
        to: aptDetails.patient_email,
        patientName: aptDetails.patient_name,
        doctorName: aptDetails.doctor_name,
        serviceName: aptDetails.service_name,
        appointmentDate: format(new Date(aptDetails.appointment_date), 'dd/MM/yyyy'),
        appointmentTime: `${aptDetails.start_time} - ${aptDetails.end_time}`,
        appointmentId,
      });
    }
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
  }

  // Gửi thông báo cho bệnh nhân
  try {
    const [patientRows] = await pool.query(
      'SELECT p.*, u.id as user_id FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = ?',
      [appointment.patientId]
    ) as any[];
    const patient = patientRows[0];

    if (patient) {
      emitNotification(patient.user_id, {
        type: 'appointment_confirmed',
        title: 'Lịch hẹn đã được xác nhận',
        message: 'Lịch hẹn của bạn đã được nhân viên xác nhận thành công.',
        appointmentId,
      });
    }
  } catch (error) {
    console.error('Failed to send confirmation notification:', error);
  }

  res.json({
    success: true,
    message: 'Xác nhận lịch hẹn thành công',
    data: updated,
  });
};

export const cancelAppointment = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Không có quyền truy cập', 403);
  }

  const appointmentId = parseInt(req.params.id);
  const { reason } = req.body;
  const appointment = await AppointmentModel.findById(appointmentId);

  if (!appointment) {
    throw new AppError('Không tìm thấy lịch hẹn', 404);
  }

  // Kiểm tra quyền hủy lịch hẹn:
  // - Patient chỉ được hủy lịch hẹn của chính mình
  // - Doctor chỉ được hủy lịch hẹn do mình phụ trách
  // - Staff/Admin được hủy tất cả lịch hẹn
  const userRole = req.user.role;
  const isStaffOrAdmin = ['staff', 'admin'].includes(userRole);
  
  if (!isStaffOrAdmin) {
    if (userRole === 'patient') {
      // Lấy patient ID từ user ID
      const patient = await PatientModel.findByUserId(req.user.id);
      if (!patient || patient.id !== appointment.patientId) {
        throw new AppError('Bạn không có quyền hủy lịch hẹn này', 403);
      }
    } else if (userRole === 'doctor') {
      // Lấy doctor ID từ user ID
      const doctor = await DoctorModel.findByUserId(req.user.id);
      if (!doctor || doctor.id !== appointment.doctorId) {
        throw new AppError('Bạn không có quyền hủy lịch hẹn này', 403);
      }
    }
  }

  if (!['pending', 'confirmed'].includes(appointment.status)) {
    throw new AppError('Lịch hẹn này không thể hủy', 400);
  }

  let cancellationFee = 0;
  const hoursUntilAppointment = differenceInHours(new Date(appointment.appointmentDate), new Date());

  if (hoursUntilAppointment < 24) {
    const service = await ServiceModel.findById(appointment.serviceId);
    if (service) {
      cancellationFee = (service.price * config.businessRules.cancellationFeePercent) / 100;
    }
  }

  const updated = await AppointmentModel.update(appointmentId, {
    status: 'cancelled',
    cancelledBy: req.user.id,
    cancelledAt: new Date(),
    reasonCancel: reason || null,
    cancellationFee: cancellationFee > 0 ? cancellationFee : undefined,
  });

  await TimeSlotModel.decrementPatientCount(appointment.slotId);

  // Send cancellation email
  try {
    const [patientRows] = await pool.query(
      'SELECT p.*, u.email FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = ?',
      [appointment.patientId]
    ) as any[];
    const patient = patientRows[0];

    const [doctorRows] = await pool.query(
      'SELECT * FROM doctors WHERE id = ?',
      [appointment.doctorId]
    ) as any[];
    const doctor = doctorRows[0];

    const [serviceRows] = await pool.query(
      'SELECT * FROM services WHERE id = ?',
      [appointment.serviceId]
    ) as any[];
    const service = serviceRows[0];

    await emailService.sendAppointmentCancelled({
      patientName: patient.full_name,
      doctorName: doctor.full_name,
      serviceName: service.name,
      dateTime: `${format(new Date(appointment.appointmentDate), 'dd/MM/yyyy')} lúc ${appointment.startTime}`,
      reason: reason || 'Không có',
      cancellationFee,
      patientEmail: patient.email,
    });
  } catch (error) {
    console.error('Failed to send cancellation email:', error);
  }

  res.json({
    success: true,
    message: cancellationFee > 0
      ? `Hủy lịch hẹn thành công. Phí hủy: ${cancellationFee.toLocaleString('vi-VN')} VNĐ`
      : 'Hủy lịch hẹn thành công',
    data: updated,
    cancellationFee: cancellationFee > 0 ? cancellationFee : undefined,
  });
};

export const checkInAppointment = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Không có quyền truy cập', 403);
  }

  const appointmentId = parseInt(req.params.id);
  const appointment = await AppointmentModel.findById(appointmentId);

  if (!appointment) {
    throw new AppError('Không tìm thấy lịch hẹn', 404);
  }

  if (appointment.status !== 'confirmed') {
    throw new AppError('Lịch hẹn phải được xác nhận trước khi check-in', 400);
  }

  const updated = await AppointmentModel.update(appointmentId, {
    status: 'checked-in',
    checkedInAt: new Date(),
  });

  res.json({
    success: true,
    message: 'Check-in thành công',
    data: updated,
  });
};

// OTP verification removed - appointments are now confirmed by staff

export const completeAppointment = async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'doctor') {
    throw new AppError('Chỉ bác sĩ mới có thể hoàn thành lịch hẹn', 403);
  }

  const appointmentId = parseInt(req.params.id);
  const { notes } = req.body;
  const appointment = await AppointmentModel.findById(appointmentId);

  if (!appointment) {
    throw new AppError('Không tìm thấy lịch hẹn', 404);
  }

  // Kiểm tra doctor chỉ được complete appointment của mình
  const doctor = await DoctorModel.findByUserId(req.user.id);
  if (!doctor || doctor.id !== appointment.doctorId) {
    throw new AppError('Bạn không có quyền hoàn thành lịch hẹn này', 403);
  }

  if (appointment.status !== 'checked-in') {
    throw new AppError('Bệnh nhân phải check-in trước', 400);
  }

  const updated = await AppointmentModel.update(appointmentId, {
    status: 'completed',
    completedAt: new Date(),
    notes: notes || null,
  });

  res.json({
    success: true,
    message: 'Hoàn thành lịch hẹn thành công',
    data: updated,
  });
};
