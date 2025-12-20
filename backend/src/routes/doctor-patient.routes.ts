import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import asyncHandler from '../middleware/asyncHandler';
import * as doctorPatientController from '../controllers/doctor-patient.controller';

const router = Router();

// Bác sĩ chấp nhận bệnh nhân
router.post('/accept/:patientId', authenticate, authorize('doctor'), asyncHandler(doctorPatientController.acceptPatient));

// Bác sĩ từ chối bệnh nhân
router.post('/reject/:patientId', authenticate, authorize('doctor'), asyncHandler(doctorPatientController.rejectPatient));

// Bác sĩ xem danh sách bệnh nhân của mình
router.get('/my-patients', authenticate, authorize('doctor'), asyncHandler(doctorPatientController.getMyPatients));

// Bác sĩ xem yêu cầu chờ xử lý
router.get('/pending', authenticate, authorize('doctor'), asyncHandler(doctorPatientController.getPendingRequests));

// Bệnh nhân yêu cầu được bác sĩ nhận
router.post('/request/:doctorId', authenticate, asyncHandler(doctorPatientController.requestAcceptance));

// Bác sĩ xóa bệnh nhân khỏi danh sách
router.delete('/:patientId', authenticate, authorize('doctor'), asyncHandler(doctorPatientController.removePatient));

export default router;


