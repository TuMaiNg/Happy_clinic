import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import asyncHandler from '../middleware/asyncHandler';
import * as appointmentController from '../controllers/appointment.controller';

const router = Router();

router.post('/', authenticate, authorize('patient', 'staff', 'admin'), asyncHandler(appointmentController.createAppointment));
router.get('/', authenticate, asyncHandler(appointmentController.getAppointments));
router.get('/:id', authenticate, asyncHandler(appointmentController.getAppointmentById));

// Appointment actions
router.put('/:id/confirm', authenticate, authorize('staff', 'admin'), asyncHandler(appointmentController.confirmAppointment));
router.put('/:id/cancel', authenticate, asyncHandler(appointmentController.cancelAppointment));
router.put('/:id/check-in', authenticate, authorize('staff', 'admin'), asyncHandler(appointmentController.checkInAppointment));
router.put('/:id/complete', authenticate, authorize('doctor'), asyncHandler(appointmentController.completeAppointment));

export default router;
