import { verifyInsurance } from '../../controllers/insurance.controller';
import { AppError } from '../../middleware/errorHandler';

// Mock dependencies
jest.mock('../../middleware/errorHandler');

describe('Insurance Controller', () => {
  const mockRequest = {
    user: { id: 1, role: 'patient' },
    body: {},
  } as any;

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should verify valid insurance number', async () => {
    mockRequest.body = {
      insuranceNumber: '1234567890123456',
      patientId: 1,
    };

    await verifyInsurance(mockRequest, mockResponse);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          isValid: true,
          policyNumber: '1234567890123456',
          coveragePercent: 80,
        }),
      })
    );
  });

  it('should reject invalid insurance number (too short)', async () => {
    mockRequest.body = {
      insuranceNumber: '12345', // Too short
      patientId: 1,
    };

    await verifyInsurance(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Mã bảo hiểm không hợp lệ',
      })
    );
  });

  it('should reject empty insurance number', async () => {
    // Test with undefined (not provided)
    mockRequest.body = {
      patientId: 1,
      // insuranceNumber is undefined
    };

    try {
      await verifyInsurance(mockRequest, mockResponse);
      // Should not reach here - should throw error
      expect(true).toBe(false); // Force test to fail if we reach here
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
    }
  });

  it('should return insurance coverage details', async () => {
    mockRequest.body = {
      insuranceNumber: '1234567890123456',
      patientId: 1,
    };

    await verifyInsurance(mockRequest, mockResponse);

    const callArgs = mockResponse.json.mock.calls[0][0];
    expect(callArgs.data).toHaveProperty('holderName');
    expect(callArgs.data).toHaveProperty('expiryDate');
    expect(callArgs.data).toHaveProperty('coveragePercent');
    expect(callArgs.data).toHaveProperty('coveredServices');
    expect(callArgs.data).toHaveProperty('maxClaimAmount');
  });
});

