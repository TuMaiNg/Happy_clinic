import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import asyncHandler from '../middleware/asyncHandler';
import * as notificationController from '../controllers/notification.controller';

const router = Router();

router.get('/', authenticate, asyncHandler(notificationController.getNotifications));
router.put('/:id/read', authenticate, asyncHandler(notificationController.markAsRead));

export default router;
