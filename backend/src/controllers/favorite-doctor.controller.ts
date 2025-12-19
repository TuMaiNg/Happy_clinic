import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { FavoriteDoctorModel } from '../models/FavoriteDoctor';
import { PatientModel } from '../models/Patient';
import { DoctorModel } from '../models/Doctor';
import { AppError } from '../middleware/errorHandler';

export const getFavorites = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Không có quyền truy cập', 403);
  }

  if (req.user.role !== 'patient') {
    throw new AppError('Chỉ bệnh nhân mới có thể xem bác sĩ yêu thích', 403);
  }

  const patient = await PatientModel.findByUserId(req.user.id);
  if (!patient || !patient.id) {
    throw new AppError('Không tìm thấy thông tin bệnh nhân', 404);
  }

  const favorites = await FavoriteDoctorModel.findByPatient(patient.id);

  res.json({
    success: true,
    data: favorites,
  });
};

export const addFavorite = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Không có quyền truy cập', 403);
  }

  if (req.user.role !== 'patient') {
    throw new AppError('Chỉ bệnh nhân mới có thể thêm bác sĩ yêu thích', 403);
  }

  const { doctorId } = req.body;
  if (!doctorId) {
    throw new AppError('Thiếu doctorId', 400);
  }

  const patient = await PatientModel.findByUserId(req.user.id);
  if (!patient || !patient.id) {
    throw new AppError('Không tìm thấy thông tin bệnh nhân', 404);
  }

  // Verify doctor exists
  const doctor = await DoctorModel.findById(doctorId);
  if (!doctor) {
    throw new AppError('Không tìm thấy bác sĩ', 404);
  }

  const favorite = await FavoriteDoctorModel.create({
    patientId: patient.id,
    doctorId: doctorId,
  });

  res.status(201).json({
    success: true,
    message: 'Đã thêm vào danh sách yêu thích',
    data: favorite,
  });
};

export const removeFavorite = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Không có quyền truy cập', 403);
  }

  if (req.user.role !== 'patient') {
    throw new AppError('Chỉ bệnh nhân mới có thể xóa bác sĩ yêu thích', 403);
  }

  const doctorId = validateIntParam(req.params.doctorId, 'doctorId');
  if (!doctorId) {
    throw new AppError('Thiếu doctorId', 400);
  }

  const patient = await PatientModel.findByUserId(req.user.id);
  if (!patient || !patient.id) {
    throw new AppError('Không tìm thấy thông tin bệnh nhân', 404);
  }

  const deleted = await FavoriteDoctorModel.delete(patient.id, doctorId);
  if (!deleted) {
    throw new AppError('Không tìm thấy bác sĩ yêu thích này', 404);
  }

  res.json({
    success: true,
    message: 'Đã xóa khỏi danh sách yêu thích',
  });
};

export const checkFavorite = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Không có quyền truy cập', 403);
  }

  if (req.user.role !== 'patient') {
    throw new AppError('Chỉ bệnh nhân mới có thể kiểm tra bác sĩ yêu thích', 403);
  }

  const doctorId = validateIntParam(req.params.doctorId, 'doctorId');
  if (!doctorId) {
    throw new AppError('Thiếu doctorId', 400);
  }

  const patient = await PatientModel.findByUserId(req.user.id);
  if (!patient || !patient.id) {
    throw new AppError('Không tìm thấy thông tin bệnh nhân', 404);
  }

  const isFavorite = await FavoriteDoctorModel.isFavorite(patient.id, doctorId);

  res.json({
    success: true,
    data: { isFavorite },
  });
};


