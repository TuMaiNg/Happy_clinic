import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import asyncHandler from '../middleware/asyncHandler';

const router = Router();

router.get('/me', authenticate, asyncHandler(async (req: any, res) => {
  res.json({
    success: true,
    data: {
      id: req.user?.id,
      email: req.user?.email,
      role: req.user?.role,
    },
  });
}));

export default router;
