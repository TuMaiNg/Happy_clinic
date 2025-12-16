import { DoctorModel } from '../models/Doctor';
import { ScheduleModel } from '../models/Schedule';
import { TimeSlotModel } from '../models/TimeSlot';
import { config } from '../config/env';
import { addDays, format, getDay } from 'date-fns';

interface GenerateResult {
  doctorName: string;
  schedulesCreated: number;
}

interface SchedulePattern {
  startTime: string;
  endTime: string;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

const defaultPattern: SchedulePattern = {
  startTime: '08:00',
  endTime: '12:00',
  daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
};

const afternoonPattern: SchedulePattern = {
  startTime: '13:00',
  endTime: '17:00',
  daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
};

/**
 * Generate time slots for a schedule
 */
const generateTimeSlots = async (
  scheduleId: number,
  startTime: string,
  endTime: string,
  maxPatientsPerSlot: number = 1
): Promise<void> => {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  const slotDuration = config.businessRules.slotDurationMinutes;

  const slots: Array<{ startTime: string; endTime: string }> = [];

  for (let currentMinutes = startTotalMinutes; currentMinutes < endTotalMinutes; currentMinutes += slotDuration) {
    const slotStartHours = Math.floor(currentMinutes / 60);
    const slotStartMinutes = currentMinutes % 60;
    const slotEndMinutes = Math.min(currentMinutes + slotDuration, endTotalMinutes);
    const slotEndHours = Math.floor(slotEndMinutes / 60);
    const slotEndMins = slotEndMinutes % 60;

    slots.push({
      startTime: `${slotStartHours.toString().padStart(2, '0')}:${slotStartMinutes.toString().padStart(2, '0')}`,
      endTime: `${slotEndHours.toString().padStart(2, '0')}:${slotEndMins.toString().padStart(2, '0')}`,
    });
  }

  // Create time slots in database
  for (const slot of slots) {
    await TimeSlotModel.create({
      scheduleId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      patientCount: 0,
      capacity: maxPatientsPerSlot,
      isAvailable: true,
    });
  }
};

/**
 * Generate schedules for a specific doctor
 */
export const generateDoctorSchedules = async (
  doctorId: number,
  daysAhead: number = 30,
  pattern?: SchedulePattern | SchedulePattern[]
): Promise<DoctorSchedule[]> => {
  const doctor = await DoctorModel.findById(doctorId);
  if (!doctor) {
    throw new Error(`Doctor with ID ${doctorId} not found`);
  }

  const patterns: SchedulePattern[] = pattern
    ? Array.isArray(pattern)
      ? pattern
      : [pattern]
    : [defaultPattern, afternoonPattern]; // Default: morning and afternoon shifts

  const schedules: DoctorSchedule[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < daysAhead; i++) {
    const date = addDays(today, i);
    const dayOfWeek = getDay(date); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Check if schedule already exists for this date
    const existing = await ScheduleModel.findByDoctorAndDate(doctorId, date);
    if (existing) {
      continue; // Skip if schedule already exists
    }

    // Find matching pattern for this day of week
    const matchingPattern = patterns.find(
      p => !p.daysOfWeek || p.daysOfWeek.includes(dayOfWeek)
    );

    if (matchingPattern) {
      const schedule = await ScheduleModel.create({
        doctorId,
        date,
        startTime: matchingPattern.startTime,
        endTime: matchingPattern.endTime,
        isDayOff: false,
        maxPatientsPerSlot: 1,
      });

      // Generate time slots
      if (schedule.id) {
        await generateTimeSlots(
          schedule.id,
          matchingPattern.startTime,
          matchingPattern.endTime,
          1
        );
      }

      schedules.push(schedule);
    }
  }

  return schedules;
};

/**
 * Generate schedules for all active doctors
 */
export const generateAllDoctorSchedules = async (
  daysAhead: number = 30
): Promise<GenerateResult[]> => {
  const doctors = await DoctorModel.findAll();

  const results: GenerateResult[] = [];

  for (const doctor of doctors) {
    if (!doctor.id) continue;

    try {
      const schedules = await generateDoctorSchedules(doctor.id, daysAhead);
      results.push({
        doctorName: doctor.fullName,
        schedulesCreated: schedules.length,
      });
    } catch (error) {
      console.error(`Error generating schedules for doctor ${doctor.fullName}:`, error);
      results.push({
        doctorName: doctor.fullName,
        schedulesCreated: 0,
      });
    }
  }

  return results;
};

// Export service object
export const scheduleGeneratorService = {
  generateDoctorSchedules,
  generateAllDoctorSchedules,
};

// Re-export types
import { DoctorSchedule } from '../models/Schedule';
