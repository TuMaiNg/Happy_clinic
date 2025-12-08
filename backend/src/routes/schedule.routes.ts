import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import asyncHandler from '../middleware/asyncHandler';
import * as scheduleController from '../controllers/schedule.controller';

const router = Router();

// Generate schedules (admin/staff)
router.post('/generate', authenticate, asyncHandler(scheduleController.generateSchedules));
router.post('/generate/:doctorId', authenticate, asyncHandler(scheduleController.generateDoctorSchedule));

// CRUD operations
router.get('/', authenticate, asyncHandler(scheduleController.getSchedules));
router.post('/', authenticate, authorize('doctor'), asyncHandler(scheduleController.createSchedule));
router.put('/:id', authenticate, authorize('doctor'), asyncHandler(scheduleController.updateSchedule));
router.delete('/:id', authenticate, authorize('doctor'), asyncHandler(scheduleController.deleteSchedule));

export default router;
