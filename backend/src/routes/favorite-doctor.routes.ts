import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import asyncHandler from '../middleware/asyncHandler';
import * as favoriteDoctorController from '../controllers/favorite-doctor.controller';

const router = Router();

router.get('/', authenticate, asyncHandler(favoriteDoctorController.getFavorites));
router.post('/', authenticate, asyncHandler(favoriteDoctorController.addFavorite));
router.delete('/:doctorId', authenticate, asyncHandler(favoriteDoctorController.removeFavorite));
router.get('/check/:doctorId', authenticate, asyncHandler(favoriteDoctorController.checkFavorite));

export default router;



