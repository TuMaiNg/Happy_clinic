import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import asyncHandler from '../middleware/asyncHandler';
import * as scheduleController from '../controllers/schedule.controller';

const router = Router();

// Generate schedules (admin/staff can generate for all, doctor can generate for self)
router.post('/generate', authenticate, authorize('admin', 'staff'), asyncHandler(scheduleController.generateSchedules));
router.post('/generate/:doctorId', authenticate, asyncHandler(scheduleController.generateDoctorSchedule));

// CRUD operations
router.get('/', authenticate, asyncHandler(scheduleController.getSchedules));
router.post('/', authenticate, authorize('doctor', 'admin', 'staff'), asyncHandler(scheduleController.createSchedule));
router.put('/:id', authenticate, authorize('doctor', 'admin', 'staff'), asyncHandler(scheduleController.updateSchedule));
router.delete('/:id', authenticate, authorize('doctor', 'admin', 'staff'), asyncHandler(scheduleController.deleteSchedule));

export default router;
