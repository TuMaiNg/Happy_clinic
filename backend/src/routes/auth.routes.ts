import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import asyncHandler from '../middleware/asyncHandler';
import * as authController from '../controllers/auth.controller';
import { registerLimiter, authLimiter, passwordResetLimiter } from '../middleware/rateLimiter';
import { checkAccountLockout } from '../middleware/accountLockout';

const router = Router();

router.post(
  '/register',
  registerLimiter,
  [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').isLength({ min: 8 }).withMessage('Mật khẩu phải có ít nhất 8 ký tự'),
    body('fullName').notEmpty().withMessage('Họ tên không được để trống'),
    body('phone').notEmpty().withMessage('Số điện thoại không được để trống'),
    validateRequest,
  ],
  asyncHandler(authController.register)
);

router.post(
  '/login',
  authLimiter,
  checkAccountLockout,
  [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
    validateRequest,
  ],
  asyncHandler(authController.login)
);

router.post('/refresh-token', authLimiter, asyncHandler(authController.refreshToken));
router.post('/forgot-password', passwordResetLimiter, asyncHandler(authController.forgotPassword));
router.post('/reset-password', passwordResetLimiter, asyncHandler(authController.resetPassword));
router.post('/change-password', authenticate, asyncHandler(authController.changePassword));

export default router;

