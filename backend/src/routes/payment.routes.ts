import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import asyncHandler from '../middleware/asyncHandler';
import * as paymentController from '../controllers/payment.controller';

const router = Router();

router.get('/', authenticate, asyncHandler(paymentController.getPayments));
router.get('/pending', authenticate, asyncHandler(paymentController.getPayments));
router.get('/:id', authenticate, asyncHandler(paymentController.getPaymentById));
router.post('/', authenticate, asyncHandler(paymentController.createPayment));
router.put('/:id/confirm', authenticate, authorize('staff', 'admin'), asyncHandler(paymentController.confirmPayment));

export default router;
