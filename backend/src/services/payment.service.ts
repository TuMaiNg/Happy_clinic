import { ServiceModel } from '../models/Service';
import { AppointmentModel } from '../models/Appointment';
import { differenceInHours } from 'date-fns';
import { config } from '../config/env';

export interface FeeBreakdown {
  basePrice: number;
  insuranceCoverage: number;
  finalAmount: number;
  breakdown: {
    serviceFee: number;
    discount: number;
    total: number;
  };
}

export class PaymentService {
  calculateAppointmentFee(
    appointment: any,
    insurance?: { isValid: boolean; coveragePercent?: number }
  ): FeeBreakdown {
    const basePrice = appointment.service?.price || 0;
    let finalAmount = basePrice;
    let insuranceCoverage = 0;

    if (insurance && insurance.isValid && insurance.coveragePercent) {
      insuranceCoverage = basePrice * (insurance.coveragePercent / 100);
      finalAmount = basePrice - insuranceCoverage;
    }

    return {
      basePrice,
      insuranceCoverage,
      finalAmount,
      breakdown: {
        serviceFee: basePrice,
        discount: insuranceCoverage,
        total: finalAmount,
      },
    };
  }

  calculateCancellationFee(appointment: any): number {
    let appointmentDateTime: Date;
    
    if (appointment.appointmentDate instanceof Date) {
      appointmentDateTime = appointment.appointmentDate;
      // If startTime is provided, add it to the date
      if (appointment.startTime) {
        const [hours, minutes] = appointment.startTime.split(':').map(Number);
        appointmentDateTime.setHours(hours, minutes || 0, 0, 0);
      }
    } else if (typeof appointment.appointmentDate === 'string') {
      // If it's a string, parse it
      appointmentDateTime = new Date(appointment.appointmentDate);
      if (appointment.startTime) {
        const [hours, minutes] = appointment.startTime.split(':').map(Number);
        appointmentDateTime.setHours(hours, minutes || 0, 0, 0);
      }
    } else {
      // Fallback: try to create date from appointmentDate
      appointmentDateTime = new Date(appointment.appointmentDate);
    }
    
    const now = new Date();
    const hoursUntil = differenceInHours(appointmentDateTime, now);

    // Free cancellation if > 24h ahead
    if (hoursUntil > 24) {
      return 0;
    }

    // Configurable fee if <= 24h ahead (default: 20%)
    const servicePrice = appointment.service?.price || 0;
    return servicePrice * (config.businessRules.cancellationFeePercent / 100);
  }

  async processPayment(paymentData: {
    appointmentId: number;
    amount: number;
    method: string;
    cardDetails?: any;
    insuranceInfo?: any;
  }): Promise<{ success: boolean; transactionId: string }> {
    const { appointmentId, amount, method, cardDetails, insuranceInfo } = paymentData;

    try {
      let transactionId = '';

      switch (method) {
        case 'cash':
          transactionId = `CASH-${Date.now()}`;
          break;

        case 'credit':
        case 'credit_card':
          // Mock Stripe integration
          // In production, use real Stripe API
          transactionId = `STRIPE-${Date.now()}`;
          break;

        case 'bank_transfer':
          // Generate VietQR code
          transactionId = `BANK-${Date.now()}`;
          break;

        case 'insurance':
          // Submit insurance claim
          transactionId = `INS-${Date.now()}`;
          break;

        default:
          throw new Error('Invalid payment method');
      }

      return {
        success: true,
        transactionId,
      };
    } catch (error: any) {
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }
}

export const paymentService = new PaymentService();

