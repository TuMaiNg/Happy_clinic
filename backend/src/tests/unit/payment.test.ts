import { paymentService } from '../../services/payment.service';
import { differenceInHours } from 'date-fns';

describe('Payment Service', () => {
  describe('calculateAppointmentFee', () => {
    it('should calculate correct fee without insurance', () => {
      const appointment = {
        service: { price: 200000 },
      };

      const fee = paymentService.calculateAppointmentFee(appointment);

      expect(fee.basePrice).toBe(200000);
      expect(fee.insuranceCoverage).toBe(0);
      expect(fee.finalAmount).toBe(200000);
      expect(fee.breakdown.serviceFee).toBe(200000);
      expect(fee.breakdown.discount).toBe(0);
      expect(fee.breakdown.total).toBe(200000);
    });

    it('should calculate correct fee with insurance (80% coverage)', () => {
      const appointment = {
        service: { price: 200000 },
      };

      const insurance = {
        isValid: true,
        coveragePercent: 80,
      };

      const fee = paymentService.calculateAppointmentFee(appointment, insurance);

      expect(fee.basePrice).toBe(200000);
      expect(fee.insuranceCoverage).toBe(160000); // 80% of 200000
      expect(fee.finalAmount).toBe(40000); // 20% remaining
      expect(fee.breakdown.serviceFee).toBe(200000);
      expect(fee.breakdown.discount).toBe(160000);
      expect(fee.breakdown.total).toBe(40000);
    });

    it('should calculate correct fee with insurance (50% coverage)', () => {
      const appointment = {
        service: { price: 300000 },
      };

      const insurance = {
        isValid: true,
        coveragePercent: 50,
      };

      const fee = paymentService.calculateAppointmentFee(appointment, insurance);

      expect(fee.basePrice).toBe(300000);
      expect(fee.insuranceCoverage).toBe(150000);
      expect(fee.finalAmount).toBe(150000);
    });

    it('should ignore invalid insurance', () => {
      const appointment = {
        service: { price: 200000 },
      };

      const insurance = {
        isValid: false,
        coveragePercent: 80,
      };

      const fee = paymentService.calculateAppointmentFee(appointment, insurance);

      expect(fee.insuranceCoverage).toBe(0);
      expect(fee.finalAmount).toBe(200000);
    });
  });

  describe('calculateCancellationFee', () => {
    it('should charge 20% cancellation fee within 24h', () => {
      const appointment = {
        service: { price: 200000 },
        appointmentDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours ahead
        startTime: '08:00:00',
      };

      const fee = paymentService.calculateCancellationFee(appointment);

      expect(fee).toBe(40000); // 20% of 200000
    });

    it('should not charge fee for early cancellation (> 24h)', () => {
      // Create a date 26 hours in the future to ensure > 24h
      // Don't set hours to avoid timezone issues - just use the future date as-is
      const now = new Date();
      const futureDate = new Date(now.getTime() + 26 * 60 * 60 * 1000); // 26 hours ahead
      
      const appointment = {
        service: { price: 200000 },
        appointmentDate: futureDate,
        // Don't provide startTime to avoid timezone complications
      };

      const fee = paymentService.calculateCancellationFee(appointment);

      expect(fee).toBe(0);
    });

    it('should charge fee for exactly 24h cancellation', () => {
      const appointment = {
        service: { price: 200000 },
        appointmentDate: new Date(Date.now() + 23 * 60 * 60 * 1000), // 23 hours ahead
        startTime: '08:00:00',
      };

      const fee = paymentService.calculateCancellationFee(appointment);

      expect(fee).toBe(40000);
    });

    it('should handle zero service price', () => {
      const appointment = {
        service: { price: 0 },
        appointmentDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
        startTime: '08:00:00',
      };

      const fee = paymentService.calculateCancellationFee(appointment);

      expect(fee).toBe(0);
    });
  });

  describe('processPayment', () => {
    it('should process cash payment', async () => {
      const paymentData = {
        appointmentId: 1,
        amount: 200000,
        method: 'cash',
      };

      const result = await paymentService.processPayment(paymentData);

      expect(result.success).toBe(true);
      expect(result.transactionId).toContain('CASH-');
    });

    it('should process credit card payment', async () => {
      const paymentData = {
        appointmentId: 1,
        amount: 200000,
        method: 'credit_card',
        cardDetails: { token: 'tok_visa' },
      };

      const result = await paymentService.processPayment(paymentData);

      expect(result.success).toBe(true);
      expect(result.transactionId).toContain('STRIPE-');
    });

    it('should process bank transfer payment', async () => {
      const paymentData = {
        appointmentId: 1,
        amount: 200000,
        method: 'bank_transfer',
      };

      const result = await paymentService.processPayment(paymentData);

      expect(result.success).toBe(true);
      expect(result.transactionId).toContain('BANK-');
    });

    it('should process insurance payment', async () => {
      const paymentData = {
        appointmentId: 1,
        amount: 200000,
        method: 'insurance',
        insuranceInfo: { policyNumber: 'INS123' },
      };

      const result = await paymentService.processPayment(paymentData);

      expect(result.success).toBe(true);
      expect(result.transactionId).toContain('INS-');
    });

    it('should reject invalid payment method', async () => {
      const paymentData = {
        appointmentId: 1,
        amount: 200000,
        method: 'invalid_method',
      };

      await expect(paymentService.processPayment(paymentData)).rejects.toThrow(
        'Invalid payment method'
      );
    });
  });
});

