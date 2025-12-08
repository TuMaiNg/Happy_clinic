import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { smsService } from './sms.service';

interface OTPRecord {
  id: number;
  appointmentId: number;
  otpCode: string;
  phone: string;
  expiresAt: Date;
  verifiedAt?: Date;
  attempts: number;
  createdAt: Date;
}

class OTPService {
  /**
   * Generate 6-digit OTP code
   */
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create OTP for appointment
   */
  async createOTP(appointmentId: number, phone: string): Promise<string> {
    const otp = this.generateOTP();
    
    await pool.query(
      `INSERT INTO appointment_otp (appointment_id, otp_code, phone, expires_at)
       VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))`,
      [appointmentId, otp, phone]
    );

    return otp;
  }

  /**
   * Send OTP via SMS
   */
  async sendOTP(phone: string, otp: string): Promise<void> {
    const message = `Happy Care - Mã xác nhận đặt lịch: ${otp}. Có hiệu lực trong 5 phút.`;
    
    try {
      await smsService.sendSMS(phone, message);
      console.log(`✓ OTP sent to ${this.maskPhone(phone)}: ${otp}`);
    } catch (error) {
      console.error('Failed to send OTP:', error);
      // In production, you might want to throw here
      // For now, we'll just log (since SMS is mocked)
    }
  }

  /**
   * Get active OTP for appointment
   */
  async getActiveOTP(appointmentId: number): Promise<OTPRecord | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM appointment_otp 
       WHERE appointment_id = ? 
       AND expires_at > NOW()
       AND verified_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [appointmentId]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      appointmentId: row.appointment_id,
      otpCode: row.otp_code,
      phone: row.phone,
      expiresAt: new Date(row.expires_at),
      verifiedAt: row.verified_at ? new Date(row.verified_at) : undefined,
      attempts: row.attempts,
      createdAt: new Date(row.created_at),
    };
  }

  /**
   * Verify OTP
   */
  async verifyOTP(appointmentId: number, otpCode: string): Promise<{
    verified: boolean;
    error?: string;
  }> {
    const otpRecord = await this.getActiveOTP(appointmentId);

    if (!otpRecord) {
      return {
        verified: false,
        error: 'Mã đã hết hạn hoặc không tồn tại',
      };
    }

    // Check attempts
    if (otpRecord.attempts >= 3) {
      return {
        verified: false,
        error: 'Bạn đã nhập sai quá 3 lần. Vui lòng yêu cầu mã mới.',
      };
    }

    // Check OTP
    if (otpRecord.otpCode !== otpCode) {
      // Increment attempts
      await pool.query(
        `UPDATE appointment_otp SET attempts = attempts + 1 WHERE id = ?`,
        [otpRecord.id]
      );

      const remainingAttempts = 3 - (otpRecord.attempts + 1);
      return {
        verified: false,
        error: `Mã không đúng. Còn ${remainingAttempts} lần thử.`,
      };
    }

    // OTP correct → Mark as verified
    await pool.query(
      `UPDATE appointment_otp SET verified_at = NOW() WHERE id = ?`,
      [otpRecord.id]
    );

    return { verified: true };
  }

  /**
   * Check rate limit for resending OTP
   */
  async canResendOTP(appointmentId: number): Promise<{
    canResend: boolean;
    waitSeconds?: number;
  }> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT created_at FROM appointment_otp 
       WHERE appointment_id = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [appointmentId]
    );

    if (rows.length === 0) {
      return { canResend: true };
    }

    const lastCreatedAt = new Date(rows[0].created_at);
    const secondsSinceLast = (Date.now() - lastCreatedAt.getTime()) / 1000;
    const minWaitSeconds = 60; // 1 minute

    if (secondsSinceLast < minWaitSeconds) {
      return {
        canResend: false,
        waitSeconds: Math.ceil(minWaitSeconds - secondsSinceLast),
      };
    }

    return { canResend: true };
  }

  /**
   * Resend OTP
   */
  async resendOTP(appointmentId: number, phone: string): Promise<{
    sent: boolean;
    error?: string;
    otp?: string;
  }> {
    // Check rate limit
    const rateLimit = await this.canResendOTP(appointmentId);
    if (!rateLimit.canResend) {
      return {
        sent: false,
        error: `Vui lòng đợi ${rateLimit.waitSeconds} giây trước khi gửi lại`,
      };
    }

    // Generate and send new OTP
    const otp = await this.createOTP(appointmentId, phone);
    await this.sendOTP(phone, otp);

    return { sent: true, otp };
  }

  /**
   * Mask phone number for display
   */
  maskPhone(phone: string): string {
    if (!phone || phone.length < 5) return phone; // Need at least 5 chars to mask
    
    const firstTwo = phone.slice(0, 2);
    const lastThree = phone.slice(-3);
    const maskLength = Math.max(0, phone.length - 5);
    const masked = '*'.repeat(maskLength);
    
    return `${firstTwo}${masked}${lastThree}`;
  }

  /**
   * Get OTP statistics for monitoring
   */
  async getOTPStats(appointmentId: number): Promise<{
    totalAttempts: number;
    verified: boolean;
    expired: boolean;
  }> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        SUM(attempts) as total_attempts,
        MAX(verified_at IS NOT NULL) as verified,
        MAX(expires_at < NOW()) as expired
       FROM appointment_otp 
       WHERE appointment_id = ?`,
      [appointmentId]
    );

    return {
      totalAttempts: rows[0]?.total_attempts || 0,
      verified: Boolean(rows[0]?.verified),
      expired: Boolean(rows[0]?.expired),
    };
  }
}

export const otpService = new OTPService();
