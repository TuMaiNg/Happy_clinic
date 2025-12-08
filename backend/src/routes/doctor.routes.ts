import { Router } from 'express';
import { DoctorModel } from '../models/Doctor';
import asyncHandler from '../middleware/asyncHandler';

const router = Router();

// Public: Get all doctors
router.get('/', asyncHandler(async (req, res) => {
  const doctors = await DoctorModel.findAll({
    speciality: req.query.speciality as string,
    search: req.query.search as string,
  });
  res.json({ success: true, data: doctors });
}));

// Public: Get doctor by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const doctor = await DoctorModel.findById(parseInt(req.params.id));
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy bác sĩ' });
  }
  return res.json({ success: true, data: doctor });
}));

export default router;
