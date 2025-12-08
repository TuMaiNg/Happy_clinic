import cron from 'node-cron';
import { notificationService } from '../services/notification.service';

// Run every hour to send reminders for appointments 24h ahead
cron.schedule('0 * * * *', async () => {
  console.log('⏰ Running appointment reminder job...');
  try {
    await notificationService.scheduleReminders();
    console.log('✅ Reminder job completed');
  } catch (error) {
    console.error('❌ Reminder job failed:', error);
  }
});

// Run every 5 minutes to process pending notifications
cron.schedule('*/5 * * * *', async () => {
  console.log('📨 Processing pending notifications...');
  try {
    await notificationService.processPendingNotifications();
  } catch (error) {
    console.error('❌ Notification processing failed:', error);
  }
});

console.log('📅 Cron jobs scheduled');

