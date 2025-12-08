import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

// Mock insurance verification
// In production, integrate with real insurance API
export const verifyInsurance = async (req: AuthRequest, res: Response): Promise<void> => {
  const { insuranceNumber, patientId } = req.body;

  if (!insuranceNumber || (typeof insuranceNumber === 'string' && insuranceNumber.trim().length === 0)) {
    throw new AppError('Vui lòng nhập mã bảo hiểm', 400);
  }

  // Mock verification logic
  // In production, call external insurance API
  const isValid = insuranceNumber.length >= 10;

  if (!isValid) {
    res.status(400).json({
      success: false,
      message: 'Mã bảo hiểm không hợp lệ',
    });
    return;
  }

  // Continue with valid insurance

  // Mock insurance data
  const coverage = {
    isValid: true,
    policyNumber: insuranceNumber,
    holderName: 'Người được bảo hiểm',
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    coveragePercent: 80, // 80% coverage
    coveredServices: ['general', 'specialist'],
    maxClaimAmount: 5000000, // 5M VND
  };

  res.json({
    success: true,
    data: coverage,
  });
};

