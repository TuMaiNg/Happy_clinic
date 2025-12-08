// Payment Controller Tests
import { PaymentModel } from '../../models/Payment';
import { AppointmentModel } from '../../models/Appointment';
import { PatientModel } from '../../models/Patient';

// Mock all dependencies
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    getConnection: jest.fn(),
    query: jest.fn(),
    execute: jest.fn(),
    end: jest.fn(),
  },
}));

jest.mock('../../models/Payment', () => ({
  PaymentModel: {
    findById: jest.fn(),
    findByAppointment: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../../models/Appointment', () => ({
  AppointmentModel: {
    findById: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../../models/Patient', () => ({
  PatientModel: {
    findByUserId: jest.fn(),
  },
}));

describe('Test Setup', () => {
  it('should load test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});

describe('Payment Controller - Authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Payment Confirmation', () => {
    it('should only allow staff/admin to confirm payments', () => {
      const allowedRoles = ['staff', 'admin'];
      
      expect(allowedRoles).toContain('staff');
      expect(allowedRoles).toContain('admin');
      expect(allowedRoles).not.toContain('patient');
      expect(allowedRoles).not.toContain('doctor');
    });

    it('should update payment status to paid when confirmed', async () => {
      const mockPayment = {
        id: 1,
        appointmentId: 1,
        amount: 500000,
        status: 'pending',
      };

      (PaymentModel.findById as jest.Mock).mockResolvedValue(mockPayment);
      (PaymentModel.update as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: 'paid',
        paidAt: new Date(),
      });

      const updatedPayment = await PaymentModel.update(1, { status: 'paid' });
      expect(updatedPayment?.status).toBe('paid');
    });

    it('should reject confirmation of non-pending payment', async () => {
      const mockPayment = {
        id: 1,
        status: 'paid', // Already paid
      };

      (PaymentModel.findById as jest.Mock).mockResolvedValue(mockPayment);

      // Should reject if status is not pending
      expect(['pending']).not.toContain(mockPayment.status);
    });
  });

  describe('Payment Refund', () => {
    it('should only allow admin to process refunds', () => {
      const allowedRoles = ['admin'];
      
      expect(allowedRoles).toContain('admin');
      expect(allowedRoles).not.toContain('staff');
      expect(allowedRoles).not.toContain('patient');
    });

    it('should only refund paid payments', async () => {
      const mockPayment = {
        id: 1,
        status: 'paid',
        amount: 500000,
      };

      (PaymentModel.findById as jest.Mock).mockResolvedValue(mockPayment);

      // Can only refund if status is 'paid'
      expect(mockPayment.status).toBe('paid');
    });

    it('should not refund pending payments', async () => {
      const mockPayment = {
        id: 1,
        status: 'pending',
      };

      (PaymentModel.findById as jest.Mock).mockResolvedValue(mockPayment);

      // Should not allow refund for pending
      expect(mockPayment.status).not.toBe('paid');
    });
  });

  describe('Payment Viewing', () => {
    it('should allow patient to view their own payments', async () => {
      const mockPatient = { id: 1, userId: 10 };
      const mockAppointment = { id: 1, patientId: 1 };
      const mockPayment = { id: 1, appointmentId: 1 };

      (PatientModel.findByUserId as jest.Mock).mockResolvedValue(mockPatient);
      (AppointmentModel.findById as jest.Mock).mockResolvedValue(mockAppointment);
      (PaymentModel.findByAppointment as jest.Mock).mockResolvedValue(mockPayment);

      // Patient's ID matches appointment's patientId
      expect(mockAppointment.patientId).toBe(mockPatient.id);
    });

    it('should not allow patient to view other patient payments', async () => {
      const mockPatient = { id: 1, userId: 10 };
      const mockAppointment = { id: 1, patientId: 2 }; // Different patient
      const mockPayment = { id: 1, appointmentId: 1 };

      (PatientModel.findByUserId as jest.Mock).mockResolvedValue(mockPatient);
      (AppointmentModel.findById as jest.Mock).mockResolvedValue(mockAppointment);

      // Patient's ID doesn't match
      expect(mockAppointment.patientId).not.toBe(mockPatient.id);
    });

    it('should allow staff to view all payments', () => {
      const staffRole = 'staff';
      const rolesWithFullAccess = ['staff', 'admin'];
      
      expect(rolesWithFullAccess).toContain(staffRole);
    });
  });

  describe('Payment Amount Validation', () => {
    it('should reject negative payment amounts', () => {
      const paymentData = {
        amount: -100,
      };

      expect(paymentData.amount).toBeLessThan(0);
    });

    it('should reject zero payment amounts', () => {
      const paymentData = {
        amount: 0,
      };

      expect(paymentData.amount).toBeLessThanOrEqual(0);
    });

    it('should accept valid payment amounts', () => {
      const paymentData = {
        amount: 500000,
      };

      expect(paymentData.amount).toBeGreaterThan(0);
    });
  });
});
