import { paymentService } from '../payment.service';
import api from '../../config/api';

jest.mock('../../config/api');

describe('Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create payment successfully', async () => {
      const mockPayment = {
        id: 1,
        appointmentId: 1,
        amount: 200000,
        paymentMethod: 'cash',
        status: 'pending',
      };

      (api.post as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          data: mockPayment,
        },
      });

      const result = await paymentService.create({
        appointmentId: 1,
        paymentMethod: 'cash',
        amount: 200000,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPayment);
      expect(api.post).toHaveBeenCalledWith('/payments', {
        appointmentId: 1,
        paymentMethod: 'cash',
        amount: 200000,
      });
    });

    it('should handle payment creation error', async () => {
      (api.post as jest.Mock).mockRejectedValue(new Error('Payment failed'));

      await expect(
        paymentService.create({
          appointmentId: 1,
          paymentMethod: 'cash',
          amount: 200000,
        })
      ).rejects.toThrow('Payment failed');
    });
  });

  describe('getAll', () => {
    it('should fetch all payments', async () => {
      const mockPayments = [
        {
          id: 1,
          appointmentId: 1,
          amount: 200000,
          status: 'paid',
        },
        {
          id: 2,
          appointmentId: 2,
          amount: 300000,
          status: 'pending',
        },
      ];

      (api.get as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          data: mockPayments,
        },
      });

      const result = await paymentService.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPayments);
      expect(api.get).toHaveBeenCalledWith('/payments', { params: undefined });
    });

    it('should fetch payments with filters', async () => {
      const filters = {
        status: 'paid',
        fromDate: '2025-12-01',
        toDate: '2025-12-31',
      };

      (api.get as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          data: [],
        },
      });

      await paymentService.getAll(filters);

      expect(api.get).toHaveBeenCalledWith('/payments', { params: filters });
    });
  });

  describe('confirm', () => {
    it('should confirm payment', async () => {
      const mockPayment = {
        id: 1,
        status: 'paid',
        transactionId: 'TXN123',
      };

      (api.put as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          data: mockPayment,
        },
      });

      const result = await paymentService.confirm(1, 'TXN123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPayment);
      expect(api.put).toHaveBeenCalledWith('/payments/1/confirm', {
        transactionId: 'TXN123',
      });
    });
  });
});



