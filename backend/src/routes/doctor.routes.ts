import { Router } from 'express';
import { DoctorModel } from '../models/Doctor';
import { doctorController } from '../controllers/doctor.controller';
import asyncHandler from '../middleware/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';
import pool from '../config/database';

const router = Router();

// Public: Get all doctors (cached for 5 minutes)
router.get('/', cacheMiddleware({ ttl: 300 }), asyncHandler(async (req, res) => {
  const doctors = await DoctorModel.findAll({
    speciality: req.query.speciality as string,
    search: req.query.search as string,
  });
  
  // Also return count for debugging
  const [userCount] = await pool.query(
    `SELECT COUNT(*) as count FROM users WHERE role = 'doctor'`
  ) as any[];
  
  res.json({ 
    success: true, 
    data: doctors,
    meta: {
      totalDoctors: doctors.length,
      totalUsersWithDoctorRole: userCount[0].count,
    },
  });
}));

// Public: Get doctor by ID (cached for 5 minutes)
router.get('/:id', cacheMiddleware({ ttl: 300 }), asyncHandler(async (req, res) => {
  const doctor = await DoctorModel.findById(parseInt(req.params.id));
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy bác sĩ' });
  }
  return res.json({ success: true, data: doctor });
}));

// Admin/Staff: Create doctor (clears cache)
router.post('/', authenticate, authorize('admin', 'staff'), asyncHandler(async (req, res) => {
  await doctorController.createDoctor(req, res);
  // Clear cache after creating doctor
  const { clearCache } = await import('../middleware/cache');
  clearCache('GET:/api/doctors');
}));

// Admin/Staff: Update doctor (clears cache)
router.put('/:id', authenticate, authorize('admin', 'staff'), asyncHandler(async (req, res) => {
  await doctorController.updateDoctor(req, res);
  // Clear cache after updating doctor
  const { clearCache } = await import('../middleware/cache');
  clearCache('GET:/api/doctors');
}));

// Admin: Delete doctor (clears cache)
router.delete('/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  await doctorController.deleteDoctor(req, res);
  // Clear cache after deleting doctor
  const { clearCache } = await import('../middleware/cache');
  clearCache('GET:/api/doctors');
}));

// Public: Check doctors count (for debugging)
router.get('/check/count', asyncHandler(async (req, res) => {
  const [users] = await pool.query(
    `SELECT COUNT(*) as count FROM users WHERE role = 'doctor'`
  ) as any[];
  
  const [doctors] = await pool.query(
    `SELECT COUNT(*) as count FROM doctors`
  ) as any[];

  const [doctorDetails] = await pool.query(
    `SELECT d.id, d.full_name, d.speciality, u.email, u.status
     FROM doctors d
     JOIN users u ON d.user_id = u.id
     ORDER BY d.id`
  ) as any[];

  res.json({
    success: true,
    data: {
      userCount: users[0].count,
      doctorCount: doctors[0].count,
      doctors: doctorDetails,
    },
  });
}));

export default router;
