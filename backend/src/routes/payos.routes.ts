import { Router } from 'express';
import express from 'express';
import asyncHandler from '../middleware/asyncHandler';
import { authenticate } from '../middleware/auth';
import * as payosController from '../controllers/payos.controller';

const router = Router();

// Tạo link thanh toán PayOS (yêu cầu đăng nhập)
router.post('/create', authenticate, asyncHandler(payosController.createLink));

// Kiểm tra trạng thái theo orderCode (yêu cầu đăng nhập)
router.get('/status', authenticate, asyncHandler(payosController.status));

// Webhook từ PayOS (không auth, cần raw body để verify chữ ký)
router.post('/webhook', express.raw({ type: '*/*' }), asyncHandler(payosController.webhook));

export default router;

