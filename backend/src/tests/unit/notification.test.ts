import { notificationService, NotificationService } from '../../services/notification.service';
import { emailService } from '../../services/email.service';
import { emitNotification } from '../../services/socket.service';
import pool from '../../config/database';
import { addHours, format } from 'date-fns';

// Mock dependencies
jest.mock('../../services/email.service');
jest.mock('../../services/socket.service');
jest.mock('../../config/database');

describe('Notification Service', () => {
  let notificationService: NotificationService;

  beforeEach(() => {
    notificationService = new NotificationService();
    jest.clearAllMocks();
  });

  describe('sendAppointmentReminder', () => {
    it('should send reminder email and in-app notification', async () => {
      const appointmentId = 1;

      const mockAppointment = [
        {
          id: 1,
          patient_name: 'Nguyễn Văn A',
          patient_phone: '0901234567',
          patient_email: 'patient@example.com',
          doctor_name: 'BS. Nguyễn Văn B',
          specialty: 'Nhi khoa',
          service_name: 'Khám tổng quát',
          appointment_date: '2025-12-10',
          start_time: '08:00:00',
          user_id: 1,
        },
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce([mockAppointment]);
      (pool.query as jest.Mock).mockResolvedValueOnce([[]]); // For notification insert
      (emailService.sendAppointmentReminder as jest.Mock).mockResolvedValue(undefined);

      await notificationService.sendAppointmentReminder(appointmentId);

      expect(emailService.sendAppointmentReminder).toHaveBeenCalledWith(
        expect.objectContaining({
          patientName: 'Nguyễn Văn A',
          doctorName: 'BS. Nguyễn Văn B',
        })
      );

      expect(emitNotification).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          type: 'appointment-reminder',
          title: '⏰ Nhắc lịch khám',
        })
      );

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notifications'),
        expect.any(Array)
      );
    });

    it('should handle email sending failure gracefully', async () => {
      const appointmentId = 1;

      const mockAppointment = [
        {
          id: 1,
          patient_name: 'Nguyễn Văn A',
          patient_email: 'patient@example.com',
          doctor_name: 'BS. Nguyễn Văn B',
          appointment_date: '2025-12-10',
          start_time: '08:00:00',
          user_id: 1,
        },
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce([mockAppointment]);
      (pool.query as jest.Mock).mockResolvedValueOnce([[]]);
      (emailService.sendAppointmentReminder as jest.Mock).mockRejectedValue(
        new Error('Email failed')
      );

      // Should not throw error
      await expect(
        notificationService.sendAppointmentReminder(appointmentId)
      ).resolves.not.toThrow();

      // Should still send in-app notification
      expect(emitNotification).toHaveBeenCalled();
    });
  });

  describe('scheduleReminders', () => {
    it('should find and send reminders for appointments 24h ahead', async () => {
      const tomorrow = addHours(new Date(), 24);
      const tomorrowDate = format(tomorrow, 'yyyy-MM-dd');

      const mockAppointments = [
        { id: 1 },
        { id: 2 },
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce([mockAppointments]);
      (pool.query as jest.Mock).mockResolvedValueOnce([
        [
          {
            id: 1,
            patient_name: 'Patient 1',
            patient_email: 'patient1@example.com',
            doctor_name: 'Doctor 1',
            appointment_date: tomorrowDate,
            start_time: '08:00:00',
            user_id: 1,
          },
        ],
      ]);
      (pool.query as jest.Mock).mockResolvedValueOnce([[]]); // Notification insert
      (pool.query as jest.Mock).mockResolvedValueOnce([
        [
          {
            id: 2,
            patient_name: 'Patient 2',
            patient_email: 'patient2@example.com',
            doctor_name: 'Doctor 2',
            appointment_date: tomorrowDate,
            start_time: '09:00:00',
            user_id: 2,
          },
        ],
      ]);
      (pool.query as jest.Mock).mockResolvedValueOnce([[]]); // Notification insert
      (emailService.sendAppointmentReminder as jest.Mock).mockResolvedValue(undefined);

      await notificationService.scheduleReminders();

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT a.id'),
        [tomorrowDate]
      );

      expect(emailService.sendAppointmentReminder).toHaveBeenCalledTimes(2);
    });

    it('should skip appointments that already have reminders today', async () => {
      const tomorrow = addHours(new Date(), 24);
      const tomorrowDate = format(tomorrow, 'yyyy-MM-dd');

      const mockAppointments: any[] = []; // No appointments found

      (pool.query as jest.Mock).mockResolvedValueOnce([mockAppointments]);

      await notificationService.scheduleReminders();

      expect(emailService.sendAppointmentReminder).not.toHaveBeenCalled();
    });

    it('should handle errors for individual appointments', async () => {
      const tomorrow = addHours(new Date(), 24);
      const tomorrowDate = format(tomorrow, 'yyyy-MM-dd');

      const mockAppointments = [{ id: 1 }];

      (pool.query as jest.Mock).mockResolvedValueOnce([mockAppointments]);
      (pool.query as jest.Mock).mockResolvedValueOnce([
        [
          {
            id: 1,
            patient_name: 'Patient 1',
            patient_email: 'patient1@example.com',
            doctor_name: 'Doctor 1',
            appointment_date: tomorrowDate,
            start_time: '08:00:00',
            user_id: 1,
          },
        ],
      ]);
      (emailService.sendAppointmentReminder as jest.Mock).mockRejectedValue(
        new Error('Failed')
      );

      // Should not throw, should continue processing
      await expect(notificationService.scheduleReminders()).resolves.not.toThrow();
    });
  });

  describe('processPendingNotifications', () => {
    it('should retry pending notifications', async () => {
      const mockPendingNotifications = [
        {
          id: 1,
          recipient_type: 'email',
          status: 'pending',
          retry_count: 0,
        },
        {
          id: 2,
          recipient_type: 'email',
          status: 'pending',
          retry_count: 1,
        },
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce([mockPendingNotifications]);
      (pool.query as jest.Mock).mockResolvedValueOnce([[]]); // Update query

      await notificationService.processPendingNotifications();

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM notifications'),
        expect.any(Array)
      );
    });

    it('should mark as failed after 3 retries', async () => {
      const mockPendingNotifications = [
        {
          id: 1,
          recipient_type: 'email',
          status: 'pending',
          retry_count: 2,
        },
      ];

      // Mock: First call gets pending notifications
      (pool.query as jest.Mock).mockResolvedValueOnce([mockPendingNotifications]);
      // Mock: Second call in retryNotification gets the notification
      (pool.query as jest.Mock).mockResolvedValueOnce([mockPendingNotifications]);
      // Mock: Third call in retryNotification throws error (simulating retry failure)
      (pool.query as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Retry failed');
      });
      // Mock: Fourth call updates to failed status (retry_count = 3, so status = 'failed')
      (pool.query as jest.Mock).mockResolvedValueOnce([[]]);

      await notificationService.processPendingNotifications();

      // Should have called UPDATE with failed status
      const updateCalls = (pool.query as jest.Mock).mock.calls.filter((call: any[]) =>
        call[0]?.includes('UPDATE notifications') && 
        call[0]?.includes('failed') &&
        Array.isArray(call[1]) &&
        call[1][0] === 3 // retry_count = 3
      );
      
      expect(updateCalls.length).toBeGreaterThan(0);
    });
  });
});

