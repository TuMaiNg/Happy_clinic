import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import asyncHandler from '../middleware/asyncHandler';

const router = Router();

router.get('/clinic', asyncHandler(async (req, res) => {
  res.json({ success: true, data: {} });
}));

router.put('/clinic', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  res.json({ success: true, data: {} });
}));

export default router;
