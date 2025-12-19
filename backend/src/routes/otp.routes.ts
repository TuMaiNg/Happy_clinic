import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import asyncHandler from '../middleware/asyncHandler';
import * as otpController from '../controllers/otp.controller';

const router = Router();

// OTP verification endpoints
router.post('/appointments/:id/verify-otp', asyncHandler(otpController.verifyOTP));
router.post('/appointments/:id/resend-otp', asyncHandler(otpController.resendOTP));
router.get('/appointments/:id/otp-status', asyncHandler(otpController.getOTPStatus));

export default router;




















