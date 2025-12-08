import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { PatientModel } from '../models/Patient';
import asyncHandler from '../middleware/asyncHandler';

const router = Router();

router.get('/', authenticate, authorize('staff', 'admin'), asyncHandler(async (req, res) => {
  const patients = await PatientModel.findAll({
    search: req.query.search as string,
    limit: parseInt(req.query.limit as string) || 50,
    offset: parseInt(req.query.offset as string) || 0,
  });
  res.json({ success: true, data: patients });
}));

router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const patient = await PatientModel.findById(parseInt(req.params.id));
  if (!patient) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy bệnh nhân' });
  }
  res.json({ success: true, data: patient });
}));

export default router;
