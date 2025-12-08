import { Router } from 'express';
import { TimeSlotModel } from '../models/TimeSlot';
import { AppError } from '../middleware/errorHandler';
import asyncHandler from '../middleware/asyncHandler';

const router = Router();

// Get available time slots
router.get('/available', asyncHandler(async (req, res) => {
  const { doctorId, date } = req.query;
  if (!doctorId || !date) {
    throw new AppError('Thiếu thông tin doctorId hoặc date', 400);
  }

  const slots = await TimeSlotModel.findAvailableSlots({
    doctorId: parseInt(doctorId as string),
    date: new Date(date as string),
  });

  res.json({ success: true, data: slots });
}));

export default router;
