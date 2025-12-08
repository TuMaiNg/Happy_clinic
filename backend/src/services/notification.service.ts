import pool from '../config/database';
import { emailService } from './email.service';
import { emitNotification } from './socket.service';
import { addHours, format } from 'date-fns';

class NotificationService {
  async sendAppointmentReminder(appointmentId: number) {
    // Get appointment with all details
    const [appointments] = await pool.query(
      `SELECT 
        a.*,
        p.full_name as patient_name, p.phone as patient_phone,
        d.full_name as doctor_name, d.specialty,
        s.name as service_name,
        u.email as patient_email, u.id as user_id
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN services s ON a.service_id = s.id
       JOIN users u ON p.user_id = u.id
       WHERE a.id = ?`,
      [appointmentId]
    ) as any[];

    if (appointments.length === 0) return;

    const appointment = appointments[0];

    // Send email
    try {
      await emailService.sendAppointmentReminder({
        patientName: appointment.patient_name,
        doctorName: appointment.doctor_name,
        appointmentDate: format(new Date(appointment.appointment_date), 'dd/MM/yyyy'),
        dateTime: `${format(new Date(appointment.appointment_date), 'dd/MM/yyyy')} lúc ${appointment.start_time}`,
        serviceName: appointment.service_name,
      });
    } catch (error) {
      console.error('Failed to send email reminder:', error);
    }

    // Send in-app notification
    emitNotification(appointment.user_id, {
      type: 'appointment-reminder',
      title: '⏰ Nhắc lịch khám',
      message: `Bạn có lịch khám với ${appointment.doctor_name} vào ngày mai lúc ${appointment.start_time}`,
    });

    // Create notification record
    await pool.query(
      `INSERT INTO notifications 
       (appointment_id, type, title, message, recipient, recipient_type, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        appointmentId,
        'reminder',
        'Nhắc lịch khám',
        `Bạn có lịch khám với ${appointment.doctor_name} vào ngày mai lúc ${appointment.start_time}`,
        appointment.patient_email,
        'email',
        'sent',
      ]
    );
  }

  async scheduleReminders() {
    // Find appointments 24h from now
    const tomorrow = addHours(new Date(), 24);
    const tomorrowDate = format(tomorrow, 'yyyy-MM-dd');

    const [appointments] = await pool.query(
      `SELECT a.id 
       FROM appointments a
       WHERE DATE(a.appointment_date) = ?
         AND a.status IN ('pending', 'confirmed')
         AND NOT EXISTS (
           SELECT 1 FROM notifications n 
           WHERE n.appointment_id = a.id 
           AND n.type = 'reminder'
           AND DATE(n.created_at) = CURDATE()
         )`,
      [tomorrowDate]
    ) as any[];

    for (const apt of appointments) {
      try {
        await this.sendAppointmentReminder(apt.id);
      } catch (error) {
        console.error(`Failed to send reminder for appointment #${apt.id}:`, error);
      }
    }
  }

  async processPendingNotifications() {
    const [pending] = await pool.query(
      `SELECT * FROM notifications 
       WHERE status = 'pending' 
       AND retry_count < 3
       ORDER BY created_at ASC
       LIMIT 50`
    ) as any[];

    for (const notif of pending) {
      try {
        // Retry sending notification
        await this.retryNotification(notif.id);
      } catch (error) {
        const newRetryCount = notif.retry_count + 1;
        await pool.query(
          `UPDATE notifications 
           SET retry_count = ?,
               error_message = ?,
               status = CASE WHEN ? >= 3 THEN 'failed' ELSE 'pending' END
           WHERE id = ?`,
          [
            newRetryCount,
            error instanceof Error ? error.message : 'Unknown error',
            newRetryCount,
            notif.id
          ]
        );
      }
    }
  }

  private async retryNotification(notificationId: number) {
    const [notifications] = await pool.query(
      'SELECT * FROM notifications WHERE id = ?',
      [notificationId]
    ) as any[];

    if (notifications.length === 0) return;

    const notif = notifications[0];

    // Retry based on recipient type
    if (notif.recipient_type === 'email') {
      // Retry email sending logic
      await pool.query(
        `UPDATE notifications 
         SET status = 'sent', sent_at = NOW() 
         WHERE id = ?`,
        [notificationId]
      );
    }
  }

  async sendAppointmentConfirmation(appointmentId: number) {
    // Get appointment with all details
    const [appointments] = await pool.query(
      `SELECT 
        a.*,
        p.full_name as patient_name, p.phone as patient_phone,
        d.full_name as doctor_name, d.specialty,
        s.name as service_name,
        u.email as patient_email, u.id as user_id
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN services s ON a.service_id = s.id
       JOIN users u ON p.user_id = u.id
       WHERE a.id = ?`,
      [appointmentId]
    ) as any[];

    if (appointments.length === 0) return;

    const appointment = appointments[0];

    // Send email
    try {
      await emailService.sendAppointmentConfirmation({
        to: appointment.patient_email,
        patientName: appointment.patient_name,
        doctorName: appointment.doctor_name,
        serviceName: appointment.service_name,
        appointmentDate: format(new Date(appointment.appointment_date), 'dd/MM/yyyy'),
        appointmentTime: `${appointment.start_time} - ${appointment.end_time}`,
        appointmentId,
      });
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
    }

    // Send in-app notification
    emitNotification(appointment.user_id, {
      type: 'appointment-confirmed',
      title: 'Lịch hẹn đã xác nhận',
      message: `Lịch hẹn với ${appointment.doctor_name} đã được xác nhận`,
    });
  }

  async notifyStaff(notification: {
    type: string;
    title: string;
    message: string;
    appointmentId: number;
    priority?: string;
  }) {
    // Get all staff and admin users
    const [staffUsers] = await pool.query(
      `SELECT id FROM users WHERE role IN ('staff', 'admin') AND status = 'active'`
    ) as any[];

    // Send in-app notification to all staff
    for (const user of staffUsers) {
      emitNotification(user.id, {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        appointmentId: notification.appointmentId,
      });
    }

    // Create notification records in database
    for (const user of staffUsers) {
      await pool.query(
        `INSERT INTO notifications 
         (appointment_id, type, title, message, recipient, recipient_type, status, priority) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          notification.appointmentId,
          notification.type,
          notification.title,
          notification.message,
          user.id,
          'user',
          'sent',
          notification.priority || 'normal',
        ]
      );
    }
  }
}

export { NotificationService };
export const notificationService = new NotificationService();
