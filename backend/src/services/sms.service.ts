import twilio from 'twilio';
import { config } from '../config/env';

export class SMSService {
  private twilioClient: any = null;
  private enabled: boolean = false;

  constructor() {
    // Check if Twilio is configured
    if (
      config.sms.accountSid &&
      config.sms.authToken &&
      config.sms.phoneNumber
    ) {
      try {
        this.twilioClient = twilio(config.sms.accountSid, config.sms.authToken);
        this.enabled = true;
        console.log('✅ SMS Service: Twilio configured');
      } catch (error) {
        console.warn('⚠️ SMS Service: Twilio initialization failed, using mock');
      }
    } else {
      console.warn('⚠️ SMS Service: No credentials found, using mock mode');
    }
  }

  async sendSMS(to: string, message: string) {
    // Use Twilio if configured
    if (this.enabled && this.twilioClient) {
      try {
        await this.twilioClient.messages.create({
          body: message,
          from: config.sms.phoneNumber,
          to: to,
        });
        console.log(`✅ SMS sent via Twilio to ${this.maskPhone(to)}`);
        return { success: true, provider: 'twilio' };
      } catch (error: any) {
        console.error('❌ Twilio SMS failed:', error.message);
        // Fallback to mock
        console.log(`📱 SMS (mock fallback) to ${to}: ${message}`);
        return { success: false, error: error.message, provider: 'mock' };
      }
    }

    // Mock SMS (development/testing)
    console.log(`📱 SMS (mock) to ${this.maskPhone(to)}: ${message}`);
    return { success: true, provider: 'mock' };
  }

  /**
   * Mask phone number for logging
   */
  private maskPhone(phone: string): string {
    if (phone.length <= 5) return phone;
    const firstTwo = phone.slice(0, 2);
    const lastThree = phone.slice(-3);
    const masked = '*'.repeat(phone.length - 5);
    return `${firstTwo}${masked}${lastThree}`;
  }

  async sendOTP(phone: string, otp: string) {
    const message = `Happy Care Clinic - Mã xác nhận đặt lịch: ${otp}. Có hiệu lực trong 5 phút.`;
    await this.sendSMS(phone, message);
  }

  async sendAppointmentReminder(appointment: any) {
    const message = `Nhắc lịch: Bạn có lịch khám với ${appointment.doctor_name} vào ${appointment.start_time} ngày ${appointment.appointment_date}. Vui lòng đến đúng giờ. Happy Care Clinic`;
    console.log(`📱 SMS (mock): ${appointment.patient_phone} - ${message}`);
    return { success: true };
  }

  async sendCancellationSMS(appointment: any) {
    const message = `Lịch hẹn #${appointment.id} ngày ${appointment.appointment_date} đã bị hủy. Vui lòng liên hệ để đặt lại lịch. Happy Care Clinic`;
    console.log(`📱 SMS (mock): ${appointment.patient_phone} - ${message}`);
    return { success: true };
  }

  async sendConfirmationSMS(appointment: any) {
    const message = `Lịch hẹn #${appointment.id} đã được xác nhận. Bác sĩ: ${appointment.doctor_name}, Ngày: ${appointment.appointment_date} ${appointment.start_time}. Happy Care Clinic`;
    console.log(`📱 SMS (mock): ${appointment.patient_phone} - ${message}`);
    return { success: true };
  }
}

export const smsService = new SMSService();

