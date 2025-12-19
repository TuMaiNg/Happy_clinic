import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { gmailOAuthService } from './gmail-oauth.service';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private useOAuth2: boolean = false;

  constructor() {
    // Check if OAuth2 is enabled and configured
    if (config.email.useOAuth2 && gmailOAuthService.isConfigured() && gmailOAuthService.hasToken()) {
      this.useOAuth2 = true;
      console.log('✅ Email service: Using Gmail OAuth2');
    } else if (config.email.user && config.email.pass) {
      // Fallback to SMTP
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: false,
        auth: {
          user: config.email.user,
          pass: config.email.pass,
        },
      });
      console.log('✅ Email service: Using SMTP');
    } else {
      console.warn('⚠️ Email service not configured. Emails will be logged to console only.');
    }
  }

  private async sendEmail(to: string, subject: string, html: string) {
    // Use OAuth2 if configured
    if (this.useOAuth2) {
      try {
        await gmailOAuthService.sendEmail(to, subject, html, config.email.user);
        return;
      } catch (error) {
        console.error('❌ OAuth2 email failed, falling back to SMTP:', error);
        // Fallback to SMTP if OAuth2 fails
      }
    }

    // Use SMTP (default or fallback)
    if (!this.transporter) {
      console.log('📧 Email (not sent - no config):');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${html}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: config.email.from,
        to,
        subject,
        html,
      });
      console.log(`✅ Email sent to ${to}`);
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }
  }

  async sendPasswordReset(email: string, resetUrl: string) {
    const html = `<div>Password reset link: ${resetUrl}</div>`;
    await this.sendEmail(email, 'Đặt lại mật khẩu - Happy Care Clinic', html);
  }

  async sendAppointmentConfirmation(appointment: {
    to: string;
    patientName: string;
    doctorName: string;
    serviceName: string;
    appointmentDate: string;
    appointmentTime: string;
    appointmentId: number;
  }) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #22c55e, #eab308); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">✓ Lịch hẹn đã được xác nhận!</h1>
        </div>
        <div style="background: #FFFFFF; padding: 30px; border: 1px solid #E2E8F0;">
          <p>Xin chào <strong>${appointment.patientName}</strong>,</p>
          <p>Lịch hẹn khám của bạn đã được nhân viên xác nhận thành công.</p>
          <div style="background: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
            <h3 style="margin-top: 0; color: #166534;">Thông tin lịch hẹn</h3>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E2E8F0;">
              <span>Mã lịch hẹn:</span>
              <strong>#${appointment.appointmentId}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E2E8F0;">
              <span>Bác sĩ:</span>
              <strong>${appointment.doctorName}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E2E8F0;">
              <span>Dịch vụ:</span>
              <span>${appointment.serviceName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: none;">
              <span>Ngày:</span>
              <strong style="color: #166534;">${appointment.appointmentDate}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 1px solid #E2E8F0;">
              <span>Giờ:</span>
              <strong style="color: #166534;">${appointment.appointmentTime}</strong>
            </div>
          </div>
          <p><strong>Lưu ý quan trọng:</strong></p>
          <ul>
            <li>Vui lòng đến sớm 10-15 phút để làm thủ tục</li>
            <li>Mang theo giấy tờ tùy thân và thẻ bảo hiểm (nếu có)</li>
            <li>Thanh toán tại phòng khám khi đến khám</li>
            <li>Nếu cần hủy lịch, vui lòng thông báo trước ít nhất 24 giờ</li>
          </ul>
        </div>
        <div style="text-align: center; padding: 20px; color: #8B95A5; font-size: 14px;">
          <p><strong>Happy Care Clinic</strong></p>
          <p>123 Nguyễn Huệ, Quận 1, TP.HCM</p>
          <p>Hotline: 028 3334 4444</p>
        </div>
      </div>
    `;
    await this.sendEmail(appointment.to, 'Xác nhận lịch hẹn - Happy Care Clinic', html);
  }

  async sendAppointmentReminder(appointment: any) {
    const email = appointment.to || appointment.patientEmail || appointment.email;
    if (!email) {
      throw new Error('No recipients defined');
    }
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0066CC;">⏰ Nhắc nhở lịch hẹn</h2>
        <p>Xin chào ${appointment.patientName},</p>
        <p>Nhắc nhở: Bạn có lịch hẹn vào ngày mai:</p>
        <ul>
          <li><strong>Bác sĩ:</strong> ${appointment.doctorName}</li>
          <li><strong>Dịch vụ:</strong> ${appointment.serviceName}</li>
          <li><strong>Ngày giờ:</strong> ${appointment.dateTime}</li>
        </ul>
        <p>Vui lòng đến đúng giờ hẹn.</p>
        <p>Trân trọng,<br>Happy Care Clinic</p>
      </div>
    `;
    await this.sendEmail(email, 'Nhắc nhở lịch hẹn - Happy Care Clinic', html);
  }

  async sendAppointmentCancelled(appointment: any) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F44336;">Lịch hẹn đã bị hủy</h2>
        <p>Xin chào ${appointment.patientName},</p>
        <p>Lịch hẹn của bạn đã bị hủy:</p>
        <ul>
          <li><strong>Bác sĩ:</strong> ${appointment.doctorName}</li>
          <li><strong>Dịch vụ:</strong> ${appointment.serviceName}</li>
          <li><strong>Ngày giờ:</strong> ${appointment.dateTime}</li>
          ${appointment.reason ? `<li><strong>Lý do:</strong> ${appointment.reason}</li>` : ''}
          ${appointment.cancellationFee > 0 ? `<li><strong>Phí hủy:</strong> ${appointment.cancellationFee.toLocaleString('vi-VN')} VNĐ</li>` : ''}
        </ul>
        <p>Vui lòng đặt lịch hẹn mới nếu cần.</p>
        <p>Trân trọng,<br>Happy Care Clinic</p>
      </div>
    `;
    await this.sendEmail(appointment.patientEmail || appointment.email, 'Lịch hẹn đã bị hủy - Happy Care Clinic', html);
  }

  async sendAppointmentRescheduled(appointment: {
    patientName: string;
    doctorName: string;
    serviceName: string;
    oldDateTime: string;
    newDateTime: string;
    reason?: string;
    patientEmail: string;
  }) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">🔄 Lịch hẹn đã được đổi</h1>
        </div>
        <div style="background: #FFFFFF; padding: 30px; border: 1px solid #E2E8F0;">
          <p>Xin chào <strong>${appointment.patientName}</strong>,</p>
          <p>Lịch hẹn của bạn đã được đổi thành công. Vui lòng kiểm tra thông tin mới dưới đây:</p>
          <div style="background: #F0F9FF; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6;">
            <h3 style="margin-top: 0; color: #1E40AF;">Thông tin cũ</h3>
            <div style="display: flex; justify-content: space-between; padding: 10px 0;">
              <span>Ngày giờ:</span>
              <strong>${appointment.oldDateTime}</strong>
            </div>
          </div>
          <div style="background: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
            <h3 style="margin-top: 0; color: #166534;">Thông tin mới</h3>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E2E8F0;">
              <span>Bác sĩ:</span>
              <strong>${appointment.doctorName}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E2E8F0;">
              <span>Dịch vụ:</span>
              <span>${appointment.serviceName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: none;">
              <span>Ngày giờ mới:</span>
              <strong style="color: #166534;">${appointment.newDateTime}</strong>
            </div>
            ${appointment.reason ? `<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #E2E8F0;">
              <span><strong>Lý do đổi lịch:</strong> ${appointment.reason}</span>
            </div>` : ''}
          </div>
          <p><strong>Lưu ý quan trọng:</strong></p>
          <ul>
            <li>Lịch hẹn mới sẽ cần được xác nhận lại bởi nhân viên</li>
            <li>Bạn sẽ nhận được email xác nhận sau khi nhân viên xác nhận</li>
            <li>Vui lòng đến đúng giờ hẹn mới</li>
          </ul>
        </div>
        <div style="text-align: center; padding: 20px; color: #8B95A5; font-size: 14px;">
          <p><strong>Happy Care Clinic</strong></p>
          <p>123 Nguyễn Huệ, Quận 1, TP.HCM</p>
          <p>Hotline: 028 3334 4444</p>
        </div>
      </div>
    `;
    await this.sendEmail(appointment.patientEmail, 'Lịch hẹn đã được đổi - Happy Care Clinic', html);
  }

  async sendBookingReceived(booking: { to: string; patientName: string; appointmentId: number; message: string }) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #22c55e, #eab308); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">📋 Đã nhận yêu cầu đặt lịch</h1>
        </div>
        <div style="background: #FFFFFF; padding: 30px; border: 1px solid #E2E8F0;">
          <p>Xin chào <strong>${booking.patientName}</strong>,</p>
          <p>Cảm ơn bạn đã đặt lịch khám tại Happy Care Clinic!</p>
          <div style="background: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
            <p style="margin: 0; color: #166534; font-weight: 600;">${booking.message}</p>
          </div>
          <p style="margin-top: 20px;">Mã lịch hẹn của bạn: <strong style="color: #0066CC;">#${booking.appointmentId}</strong></p>
          <p>Chúng tôi sẽ gọi điện xác nhận với bạn trong vòng 2 giờ tới. Vui lòng giữ máy!</p>
          <p style="margin-top: 20px;"><strong>Lưu ý:</strong></p>
          <ul>
            <li>Lịch hẹn của bạn đang ở trạng thái chờ xác nhận</li>
            <li>Nhân viên sẽ gọi điện để xác nhận thông tin</li>
            <li>Sau khi xác nhận, bạn sẽ nhận được email xác nhận chính thức</li>
          </ul>
        </div>
        <div style="text-align: center; padding: 20px; color: #8B95A5; font-size: 14px;">
          <p><strong>Happy Care Clinic</strong></p>
          <p>123 Nguyễn Huệ, Quận 1, TP.HCM</p>
          <p>Hotline: 028 3334 4444</p>
        </div>
      </div>
    `;
    await this.sendEmail(booking.to, 'Đã nhận yêu cầu đặt lịch - Happy Care Clinic', html);
  }

  async sendWelcome(email: string, fullName: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #22c55e, #eab308); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Chào mừng đến với Happy Care Clinic!</h1>
        </div>
        <div style="background: #FFFFFF; padding: 30px; border: 1px solid #E2E8F0;">
          <p>Xin chào <strong>${fullName}</strong>,</p>
          <p>Cảm ơn bạn đã đăng ký tài khoản tại Happy Care Clinic!</p>
          <p>Bây giờ bạn có thể:</p>
          <ul>
            <li>Đặt lịch khám trực tuyến</li>
            <li>Xem lịch sử khám bệnh</li>
            <li>Quản lý thông tin cá nhân</li>
          </ul>
          <p style="margin-top: 20px;">Chúc bạn có trải nghiệm tốt với dịch vụ của chúng tôi!</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #8B95A5; font-size: 14px;">
          <p><strong>Happy Care Clinic</strong></p>
          <p>123 Nguyễn Huệ, Quận 1, TP.HCM</p>
          <p>Hotline: 028 3334 4444</p>
        </div>
      </div>
    `;
    await this.sendEmail(email, 'Chào mừng đến với Happy Care Clinic', html);
  }

  async sendDoctorAcceptedEmail(data: {
    to: string;
    patientName: string;
    doctorName: string;
    doctorSpeciality: string;
  }) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0066CC, #00A86B); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Bác sĩ đã chấp nhận bạn!</h1>
        </div>
        <div style="background: #FFFFFF; padding: 30px; border: 1px solid #E2E8F0;">
          <p>Xin chào <strong>${data.patientName}</strong>,</p>
          <p>Chúng tôi vui mừng thông báo rằng <strong>${data.doctorName}</strong> (${data.doctorSpeciality}) đã chấp nhận bạn làm bệnh nhân của mình.</p>
          <p style="margin-top: 20px;">Bây giờ bạn có thể:</p>
          <ul>
            <li>Đặt lịch khám với bác sĩ ${data.doctorName}</li>
            <li>Xem thông tin chi tiết về bác sĩ</li>
            <li>Nhận thông báo về lịch hẹn</li>
          </ul>
          <p style="margin-top: 20px;">Chúc bạn có trải nghiệm tốt với dịch vụ của chúng tôi!</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #8B95A5; font-size: 14px;">
          <p><strong>Happy Care Clinic</strong></p>
          <p>123 Nguyễn Huệ, Quận 1, TP.HCM</p>
          <p>Hotline: 028 3334 4444</p>
        </div>
      </div>
    `;
    await this.sendEmail(data.to, 'Bác sĩ đã chấp nhận bạn - Happy Care Clinic', html);
  }
}

export const emailService = new EmailService();

