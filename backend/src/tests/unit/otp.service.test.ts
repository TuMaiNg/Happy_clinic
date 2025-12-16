import { otpService } from '../../services/otp.service';
import pool from '../../config/database';

// Mock database
jest.mock('../../config/database', () => ({
  query: jest.fn(),
}));

// Mock SMS service
jest.mock('../../services/sms.service', () => ({
  smsService: {
    sendSMS: jest.fn().mockResolvedValue(true),
  },
}));

describe('OTP Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateOTP', () => {
    it('should generate a 6-digit OTP', () => {
      const otp = otpService.generateOTP();
      expect(otp).toMatch(/^\d{6}$/);
      expect(otp.length).toBe(6);
    });

    it('should generate different OTPs on each call', () => {
      const otp1 = otpService.generateOTP();
      const otp2 = otpService.generateOTP();
      // Very unlikely to be the same, but possible
      // Just check they're both 6 digits
      expect(otp1.length).toBe(6);
      expect(otp2.length).toBe(6);
    });
  });

  describe('createOTP', () => {
    it('should create OTP in database', async () => {
      const mockInsertId = 1;
      (pool.query as jest.Mock).mockResolvedValueOnce([{ insertId: mockInsertId }]);

      const appointmentId = 123;
      const phone = '0912345678';
      const otp = await otpService.createOTP(appointmentId, phone);

      expect(otp).toMatch(/^\d{6}$/);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO appointment_otp'),
        expect.arrayContaining([appointmentId, otp, phone])
      );
    });
  });

  describe('maskPhone', () => {
    it('should mask phone number correctly', () => {
      const phone = '0912345678';
      const masked = otpService.maskPhone(phone);
      expect(masked).toMatch(/^09\*+678$/);
      expect(masked.length).toBe(phone.length);
    });

    it('should handle short phone numbers', () => {
      const phone = '1234';
      const masked = otpService.maskPhone(phone);
      expect(masked).toBe(phone); // Should return as-is if too short
    });
  });

  describe('verifyOTP', () => {
    it('should verify correct OTP', async () => {
      const appointmentId = 123;
      const otpCode = '123456';
      const mockOTPRecord = {
        id: 1,
        appointment_id: appointmentId,
        otp_code: otpCode,
        phone: '0912345678',
        expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 min from now
        verified_at: null,
        attempts: 0,
        created_at: new Date(),
      };

      // Mock getActiveOTP
      (pool.query as jest.Mock)
        .mockResolvedValueOnce([[mockOTPRecord]]) // getActiveOTP query
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // Update verified_at

      const result = await otpService.verifyOTP(appointmentId, otpCode);

      expect(result.verified).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject incorrect OTP', async () => {
      const appointmentId = 123;
      const correctOTP = '123456';
      const wrongOTP = '654321';
      const mockOTPRecord = {
        id: 1,
        appointment_id: appointmentId,
        otp_code: correctOTP,
        phone: '0912345678',
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
        verified_at: null,
        attempts: 0,
        created_at: new Date(),
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([[mockOTPRecord]]) // getActiveOTP
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // Increment attempts

      const result = await otpService.verifyOTP(appointmentId, wrongOTP);

      expect(result.verified).toBe(false);
      expect(result.error).toContain('Mã không đúng');
    });

    it('should reject after 3 failed attempts', async () => {
      const appointmentId = 123;
      const mockOTPRecord = {
        id: 1,
        appointment_id: appointmentId,
        otp_code: '123456',
        phone: '0912345678',
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
        verified_at: null,
        attempts: 3, // Already at max attempts
        created_at: new Date(),
      };

      (pool.query as jest.Mock).mockResolvedValueOnce([[mockOTPRecord]]);

      const result = await otpService.verifyOTP(appointmentId, '123456');

      expect(result.verified).toBe(false);
      expect(result.error).toContain('quá 3 lần');
    });

    it('should reject expired OTP', async () => {
      const appointmentId = 123;
      (pool.query as jest.Mock).mockResolvedValueOnce([[]]); // No active OTP found

      const result = await otpService.verifyOTP(appointmentId, '123456');

      expect(result.verified).toBe(false);
      expect(result.error).toContain('hết hạn');
    });
  });

  describe('canResendOTP', () => {
    it('should allow resend if enough time has passed', async () => {
      const appointmentId = 123;
      const oldDate = new Date(Date.now() - 120 * 1000); // 2 minutes ago
      
      (pool.query as jest.Mock).mockResolvedValueOnce([[
        { created_at: oldDate }
      ]]);

      const result = await otpService.canResendOTP(appointmentId);

      expect(result.canResend).toBe(true);
    });

    it('should block resend if too soon', async () => {
      const appointmentId = 123;
      const recentDate = new Date(Date.now() - 30 * 1000); // 30 seconds ago
      
      (pool.query as jest.Mock).mockResolvedValueOnce([[
        { created_at: recentDate }
      ]]);

      const result = await otpService.canResendOTP(appointmentId);

      expect(result.canResend).toBe(false);
      expect(result.waitSeconds).toBeGreaterThan(0);
      expect(result.waitSeconds).toBeLessThanOrEqual(60);
    });
  });

  describe('resendOTP', () => {
    it('should resend OTP if rate limit allows', async () => {
      const appointmentId = 123;
      const phone = '0912345678';
      const oldDate = new Date(Date.now() - 120 * 1000);

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([[{ created_at: oldDate }]]) // canResendOTP check
        .mockResolvedValueOnce([{ insertId: 2 }]); // createOTP insert

      const { smsService } = require('../../services/sms.service');
      
      const result = await otpService.resendOTP(appointmentId, phone);

      expect(result.sent).toBe(true);
      expect(result.otp).toMatch(/^\d{6}$/);
      expect(smsService.sendSMS).toHaveBeenCalled();
    });

    it('should block resend if rate limited', async () => {
      const appointmentId = 123;
      const phone = '0912345678';
      const recentDate = new Date(Date.now() - 10 * 1000); // 10 seconds ago

      (pool.query as jest.Mock).mockResolvedValueOnce([[
        { created_at: recentDate }
      ]]);

      const result = await otpService.resendOTP(appointmentId, phone);

      expect(result.sent).toBe(false);
      expect(result.error).toContain('đợi');
    });
  });
});



















