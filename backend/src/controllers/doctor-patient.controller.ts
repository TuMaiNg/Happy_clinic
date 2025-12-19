import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DoctorPatientModel } from '../models/DoctorPatient';
import { DoctorModel } from '../models/Doctor';
import { PatientModel } from '../models/Patient';
import { AppError } from '../middleware/errorHandler';
import { validateIntParam } from '../utils/validation';
import { emitNotification } from '../services/socket.service';
import { emailService } from '../services/email.service';

/**
 * POST /api/doctor-patients/accept/:patientId
 * Bác sĩ chấp nhận bệnh nhân
 */
export const acceptPatient = async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'doctor') {
    throw new AppError('Chỉ bác sĩ mới có thể chấp nhận bệnh nhân', 403);
  }

  const patientId = validateIntParam(req.params.patientId, 'patientId');
  const { notes } = req.body;

  // Lấy thông tin bác sĩ
  const doctor = await DoctorModel.findByUserId(req.user.id);
  if (!doctor || !doctor.id) {
    throw new AppError('Không tìm thấy thông tin bác sĩ', 404);
  }

  // Kiểm tra bệnh nhân có tồn tại không
  const patient = await PatientModel.findById(patientId);
  if (!patient) {
    throw new AppError('Không tìm thấy bệnh nhân', 404);
  }

  // Chấp nhận bệnh nhân
  const relationship = await DoctorPatientModel.acceptPatient(doctor.id, patientId, notes);

  // Gửi thông báo cho bệnh nhân
  try {
    if (patient.userId) {
      emitNotification(patient.userId, {
        type: 'doctor_accepted',
        title: 'Bác sĩ đã chấp nhận bạn',
        message: `Bác sĩ ${doctor.fullName} đã chấp nhận bạn làm bệnh nhân của mình.`,
        appointmentId: null,
      });
    }

    // Gửi email nếu có
    const patientUserId = (patient as any).user_id || (patient as any).userId;
    let patientEmail = patient.email;
    if (!patientEmail && patientUserId) {
      const { UserModel } = await import('../models/User');
      const user = await UserModel.findById(patientUserId);
      patientEmail = user?.email || null;
    }
    if (patientEmail) {
      await emailService.sendDoctorAcceptedEmail({
        to: patientEmail,
        patientName: patient.fullName,
        doctorName: doctor.fullName,
        doctorSpeciality: doctor.speciality,
      });
    }
  } catch (error) {
    console.error('Failed to send notification/email:', error);
  }

  res.json({
    success: true,
    message: 'Đã chấp nhận bệnh nhân thành công',
    data: relationship,
  });
};

/**
 * POST /api/doctor-patients/reject/:patientId
 * Bác sĩ từ chối bệnh nhân
 */
export const rejectPatient = async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'doctor') {
    throw new AppError('Chỉ bác sĩ mới có thể từ chối bệnh nhân', 403);
  }

  const patientId = validateIntParam(req.params.patientId, 'patientId');
  const { reason } = req.body;

  // Lấy thông tin bác sĩ
  const doctor = await DoctorModel.findByUserId(req.user.id);
  if (!doctor || !doctor.id) {
    throw new AppError('Không tìm thấy thông tin bác sĩ', 404);
  }

  // Kiểm tra bệnh nhân có tồn tại không
  const patient = await PatientModel.findById(patientId);
  if (!patient) {
    throw new AppError('Không tìm thấy bệnh nhân', 404);
  }

  // Từ chối bệnh nhân
  const relationship = await DoctorPatientModel.rejectPatient(doctor.id, patientId, reason);

  // Gửi thông báo cho bệnh nhân
  try {
    if (patient.userId) {
      emitNotification(patient.userId, {
        type: 'doctor_rejected',
        title: 'Bác sĩ đã từ chối yêu cầu',
        message: `Bác sĩ ${doctor.fullName} đã từ chối yêu cầu của bạn.${reason ? ` Lý do: ${reason}` : ''}`,
        appointmentId: null,
      });
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
  }

  res.json({
    success: true,
    message: 'Đã từ chối bệnh nhân',
    data: relationship,
  });
};

/**
 * GET /api/doctor-patients/my-patients
 * Bác sĩ xem danh sách bệnh nhân của mình
 */
export const getMyPatients = async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'doctor') {
    throw new AppError('Chỉ bác sĩ mới có thể xem danh sách bệnh nhân', 403);
  }

  const doctor = await DoctorModel.findByUserId(req.user.id);
  if (!doctor || !doctor.id) {
    throw new AppError('Không tìm thấy thông tin bác sĩ', 404);
  }

  const status = req.query.status as 'pending' | 'accepted' | 'rejected' | undefined;
  const patients = await DoctorPatientModel.findByDoctor(doctor.id, status);

  res.json({
    success: true,
    data: patients,
    meta: {
      total: patients.length,
      accepted: patients.filter(p => p.status === 'accepted').length,
      pending: patients.filter(p => p.status === 'pending').length,
      rejected: patients.filter(p => p.status === 'rejected').length,
    },
  });
};

/**
 * GET /api/doctor-patients/pending
 * Bác sĩ xem danh sách yêu cầu chờ xử lý
 */
export const getPendingRequests = async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'doctor') {
    throw new AppError('Chỉ bác sĩ mới có thể xem yêu cầu chờ xử lý', 403);
  }

  const doctor = await DoctorModel.findByUserId(req.user.id);
  if (!doctor || !doctor.id) {
    throw new AppError('Không tìm thấy thông tin bác sĩ', 404);
  }

  const patients = await DoctorPatientModel.findByDoctor(doctor.id, 'pending');

  res.json({
    success: true,
    data: patients,
  });
};

/**
 * POST /api/doctor-patients/request/:doctorId
 * Bệnh nhân yêu cầu được bác sĩ nhận
 */
export const requestAcceptance = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Không có quyền truy cập', 403);
  }

  const doctorId = validateIntParam(req.params.doctorId, 'doctorId');
  const { notes } = req.body;

  // Lấy thông tin bệnh nhân
  let patientId: number;
  if (req.user.role === 'patient') {
    const patient = await PatientModel.findByUserId(req.user.id);
    if (!patient || !patient.id) {
      throw new AppError('Không tìm thấy thông tin bệnh nhân', 404);
    }
    patientId = patient.id;
  } else {
    // Admin/Staff có thể tạo request cho bệnh nhân khác
    if (!req.body.patientId) {
      throw new AppError('Vui lòng chọn bệnh nhân', 400);
    }
    patientId = validateIntParam(req.body.patientId, 'patientId');
  }

  // Kiểm tra bác sĩ có tồn tại không
  const doctor = await DoctorModel.findById(doctorId);
  if (!doctor) {
    throw new AppError('Không tìm thấy bác sĩ', 404);
  }

  // Tạo yêu cầu
  const relationship = await DoctorPatientModel.requestAcceptance(patientId, doctorId, notes);

  // Gửi thông báo cho bác sĩ
  try {
    const doctorUserId = (doctor as any).user_id || (doctor as any).userId;
    if (doctorUserId) {
      const patient = await PatientModel.findById(patientId);
      emitNotification(doctorUserId, {
        type: 'patient_request',
        title: 'Có bệnh nhân yêu cầu',
        message: `Bệnh nhân ${patient?.fullName || 'N/A'} muốn được bạn nhận làm bệnh nhân.`,
        appointmentId: null,
      });
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
  }

  res.json({
    success: true,
    message: 'Đã gửi yêu cầu đến bác sĩ',
    data: relationship,
  });
};

/**
 * DELETE /api/doctor-patients/:patientId
 * Bác sĩ xóa bệnh nhân khỏi danh sách (remove relationship)
 */
export const removePatient = async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'doctor') {
    throw new AppError('Chỉ bác sĩ mới có thể xóa bệnh nhân', 403);
  }

  const patientId = validateIntParam(req.params.patientId, 'patientId');

  const doctor = await DoctorModel.findByUserId(req.user.id);
  if (!doctor || !doctor.id) {
    throw new AppError('Không tìm thấy thông tin bác sĩ', 404);
  }

  const deleted = await DoctorPatientModel.delete(doctor.id, patientId);
  if (!deleted) {
    throw new AppError('Không tìm thấy relationship', 404);
  }

  res.json({
    success: true,
    message: 'Đã xóa bệnh nhân khỏi danh sách',
  });
};

