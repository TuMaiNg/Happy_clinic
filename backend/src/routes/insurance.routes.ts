import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as insuranceController from '../controllers/insurance.controller';

const router = Router();

router.post('/verify', authenticate, insuranceController.verifyInsurance);

export default router;

