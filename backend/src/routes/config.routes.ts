import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import asyncHandler from '../middleware/asyncHandler';
import * as configController from '../controllers/config.controller';

const router = Router();

router.get('/clinic', asyncHandler(configController.getClinicInfo));
router.put('/clinic', authenticate, authorize('admin'), asyncHandler(configController.updateClinicInfo));
router.get('/system', authenticate, authorize('admin'), asyncHandler(configController.getSystemConfig));
router.put('/system', authenticate, authorize('admin'), asyncHandler(configController.updateSystemConfig));

export default router;
