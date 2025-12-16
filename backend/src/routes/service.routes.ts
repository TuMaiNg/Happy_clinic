import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { ServiceModel } from '../models/Service';
import { AppError } from '../middleware/errorHandler';
import asyncHandler from '../middleware/asyncHandler';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

// Public: Get all services (cached for 5 minutes)
router.get('/', cacheMiddleware({ ttl: 300 }), asyncHandler(async (req, res) => {
  const services = await ServiceModel.findAll({
    speciality: req.query.speciality as string,
    isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
    search: req.query.search as string,
  });
  res.json({ success: true, data: services });
}));

// Public: Get service by ID (cached for 5 minutes)
router.get('/:id', cacheMiddleware({ ttl: 300 }), asyncHandler(async (req, res) => {
  const service = await ServiceModel.findById(parseInt(req.params.id));
  if (!service) {
    throw new AppError('Không tìm thấy dịch vụ', 404);
  }
  res.json({ success: true, data: service });
}));

// Admin only: Create service (clears cache)
router.post('/', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const service = await ServiceModel.create(req.body);
  // Clear cache after creating service
  const { clearCache } = await import('../middleware/cache');
  clearCache('GET:/api/services');
  res.status(201).json({ success: true, data: service });
}));

// Admin only: Update service (clears cache)
router.put('/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const service = await ServiceModel.update(parseInt(req.params.id), req.body);
  if (!service) {
    throw new AppError('Không tìm thấy dịch vụ', 404);
  }
  // Clear cache after updating service
  const { clearCache } = await import('../middleware/cache');
  clearCache('GET:/api/services');
  res.json({ success: true, data: service });
}));

export default router;
