import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import asyncHandler from '../middleware/asyncHandler';
import * as reportController from '../controllers/report.controller';

const router = Router();

router.get('/appointments', authenticate, authorize('staff', 'admin'), asyncHandler(reportController.getAppointmentStats));
router.get('/revenue', authenticate, authorize('staff', 'admin'), asyncHandler(reportController.getRevenueStats));
router.get('/doctors-performance', authenticate, authorize('staff', 'admin'), asyncHandler(reportController.getDoctorPerformance));
router.get('/no-shows', authenticate, authorize('staff', 'admin'), asyncHandler(reportController.getNoShowStats));
router.get('/daily', authenticate, authorize('staff', 'admin'), asyncHandler(reportController.getDailyReport));

export default router;
