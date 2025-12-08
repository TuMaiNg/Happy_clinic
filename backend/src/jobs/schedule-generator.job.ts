import cron from 'node-cron';
import { scheduleGeneratorService } from '../services/schedule-generator.service';

/**
 * Run daily at 2 AM to ensure schedules exist for next 30 days
 */
cron.schedule('0 2 * * *', async () => {
  console.log('🕐 Running automatic schedule generation...');
  
  try {
    const results = await scheduleGeneratorService.generateAllDoctorSchedules(30);
    
    console.log('✓ Schedule generation completed:');
    results.forEach(result => {
      console.log(`  - ${result.doctorName}: ${result.schedulesCreated} schedules created`);
    });
  } catch (error) {
    console.error('❌ Schedule generation failed:', error);
  }
});

console.log('✓ Schedule generator cron job registered (runs daily at 2 AM)');



