import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import asyncHandler from '../middleware/asyncHandler';
import * as appointmentController from '../controllers/appointment.controller';

const router = Router();

router.post('/', authenticate, asyncHandler(appointmentController.createAppointment));
router.get('/', authenticate, asyncHandler(appointmentController.getAppointments));
router.get('/:id', authenticate, asyncHandler(appointmentController.getAppointmentById));

// OTP verification - requires authentication to prevent brute force attacks
router.post('/:id/verify-otp', authenticate, asyncHandler(appointmentController.verifyAppointmentOTP));
router.post('/:id/resend-otp', authenticate, asyncHandler(appointmentController.resendAppointmentOTP));

// Appointment actions
router.put('/:id/confirm', authenticate, authorize('staff', 'admin'), asyncHandler(appointmentController.confirmAppointment));
router.put('/:id/cancel', authenticate, asyncHandler(appointmentController.cancelAppointment));
router.put('/:id/check-in', authenticate, authorize('staff', 'admin'), asyncHandler(appointmentController.checkInAppointment));
router.put('/:id/complete', authenticate, authorize('doctor'), asyncHandler(appointmentController.completeAppointment));

export default router;
