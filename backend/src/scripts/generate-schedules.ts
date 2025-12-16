/**
 * Run this script once to populate schedules for next 30 days
 * Usage: npm run generate-schedules
 */

import { scheduleGeneratorService } from '../services/schedule-generator.service';

async function main() {
  console.log('Starting schedule generation for next 30 days...\n');
  
  try {
    const results = await scheduleGeneratorService.generateAllDoctorSchedules(30);
    
    console.log('\n✓ Schedule generation completed!\n');
    console.log('Summary:');
    results.forEach(result => {
      console.log(`  - ${result.doctorName}: ${result.schedulesCreated} schedules created`);
    });
    
    console.log('\n✅ All done! Schedules are now available for the next 30 days.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();



















