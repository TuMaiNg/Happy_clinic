import pool from '../config/database';
import { addDays, addMinutes, format, parse } from 'date-fns';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface DoctorWorkingPattern {
  doctorId: number;
  workingDays: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // "08:00:00"
  endTime: string; // "17:00:00"
  lunchBreak?: {
    start: string; // "12:00:00"
    end: string; // "13:00:00"
  };
  maxPatientsPerSlot: number;
  daysOff?: string[]; // ["2025-12-25", "2025-12-31"]
}

class ScheduleGeneratorService {
  
  /**
   * Generate schedules for a doctor for the next N days
   */
  async generateDoctorSchedules(
    doctorId: number, 
    daysAhead: number = 30,
    pattern: DoctorWorkingPattern
  ) {
    const generatedSchedules = [];
    const today = new Date();
    
    for (let i = 0; i < daysAhead; i++) {
      const targetDate = addDays(today, i);
      const dateString = format(targetDate, 'yyyy-MM-dd');
      const dayOfWeek = targetDate.getDay();
      
      // Skip if not a working day
      if (!pattern.workingDays.includes(dayOfWeek)) {
        console.log(`Skip ${dateString} - not a working day`);
        continue;
      }
      
      // Skip if day-off
      if (pattern.daysOff?.includes(dateString)) {
        console.log(`Skip ${dateString} - marked as day-off`);
        continue;
      }
      
      // Check if schedule already exists
      const existingSchedule = await this.getSchedule(doctorId, dateString);
      if (existingSchedule) {
        console.log(`Skip ${dateString} - schedule already exists`);
        continue;
      }
      
      // Create schedule
      const schedule = await this.createSchedule({
        doctorId,
        date: dateString,
        startTime: pattern.startTime,
        endTime: pattern.endTime,
        isDayOff: false,
        maxPatientsPerSlot: pattern.maxPatientsPerSlot
      });
      
      // Generate time slots
      const slots = await this.generateTimeSlots(
        schedule.id,
        pattern.startTime,
        pattern.endTime,
        pattern.lunchBreak
      );
      
      generatedSchedules.push({
        schedule,
        slotsCount: slots.length
      });
      
      console.log(`✓ Generated schedule for ${dateString} with ${slots.length} slots`);
    }
    
    return generatedSchedules;
  }
  
  /**
   * Generate time slots for a schedule (30-minute intervals)
   */
  async generateTimeSlots(
    scheduleId: number,
    startTime: string,
    endTime: string,
    lunchBreak?: { start: string; end: string }
  ) {
    const slots = [];
    const slotDuration = 30; // minutes
    
    const start = parse(startTime, 'HH:mm:ss', new Date());
    const end = parse(endTime, 'HH:mm:ss', new Date());
    
    let currentTime = start;
    
    while (currentTime < end) {
      const slotStart = format(currentTime, 'HH:mm:ss');
      const slotEnd = format(addMinutes(currentTime, slotDuration), 'HH:mm:ss');
      
      // Skip lunch break
      if (lunchBreak && this.isInLunchBreak(slotStart, lunchBreak)) {
        currentTime = addMinutes(currentTime, slotDuration);
        continue;
      }
      
      // Create slot
      const slot = await this.createTimeSlot({
        scheduleId,
        startTime: slotStart,
        endTime: slotEnd,
        patientCount: 0,
        capacity: 1,
        isAvailable: true
      });
      
      slots.push(slot);
      currentTime = addMinutes(currentTime, slotDuration);
    }
    
    return slots;
  }
  
  /**
   * Generate schedules for all doctors
   */
  async generateAllDoctorSchedules(daysAhead: number = 30) {
    const doctors = await this.getAllDoctors();
    
    // Define working patterns for each doctor
    const patterns: Record<number, DoctorWorkingPattern> = {
      1: { // Dr. Nguyễn Văn An (Nhi khoa)
        doctorId: 1,
        workingDays: [1, 2, 3, 4, 5], // Mon-Fri
        startTime: "08:00:00",
        endTime: "17:00:00",
        lunchBreak: { start: "12:00:00", end: "13:00:00" },
        maxPatientsPerSlot: 1,
        daysOff: ["2025-12-25", "2025-12-31", "2026-01-01"]
      },
      2: { // Dr. Trần Thị Bình (Nội khoa)
        doctorId: 2,
        workingDays: [2, 3, 4, 5, 6], // Tue-Sat
        startTime: "08:00:00",
        endTime: "17:00:00",
        lunchBreak: { start: "12:00:00", end: "13:00:00" },
        maxPatientsPerSlot: 1,
        daysOff: ["2025-12-25", "2025-12-31"]
      },
      3: { // Dr. Hoàng Văn Cường (Nha khoa)
        doctorId: 3,
        workingDays: [1, 3, 4, 5], // Mon, Wed, Thu, Fri
        startTime: "09:00:00",
        endTime: "17:00:00",
        lunchBreak: { start: "12:00:00", end: "13:00:00" },
        maxPatientsPerSlot: 1,
        daysOff: ["2025-12-25", "2025-12-31"]
      },
      4: { // Dr. Phạm Thị Dung (Phụ khoa)
        doctorId: 4,
        workingDays: [1, 2, 3, 4, 5], // Mon-Fri
        startTime: "08:00:00",
        endTime: "17:00:00",
        lunchBreak: { start: "12:00:00", end: "13:00:00" },
        maxPatientsPerSlot: 1,
        daysOff: ["2025-12-25", "2025-12-31"]
      }
    };
    
    const results = [];
    
    for (const doctor of doctors) {
      const pattern = patterns[doctor.id];
      
      if (!pattern) {
        console.warn(`No pattern defined for doctor ${doctor.id}`);
        // Use default pattern
        const defaultPattern: DoctorWorkingPattern = {
          doctorId: doctor.id,
          workingDays: [1, 2, 3, 4, 5], // Mon-Fri
          startTime: "08:00:00",
          endTime: "17:00:00",
          lunchBreak: { start: "12:00:00", end: "13:00:00" },
          maxPatientsPerSlot: 1,
          daysOff: ["2025-12-25", "2025-12-31"]
        };
        
        const schedules = await this.generateDoctorSchedules(
          doctor.id,
          daysAhead,
          defaultPattern
        );
        
        results.push({
          doctorId: doctor.id,
          doctorName: doctor.full_name,
          schedulesCreated: schedules.length
        });
        
        continue;
      }
      
      const schedules = await this.generateDoctorSchedules(
        doctor.id,
        daysAhead,
        pattern
      );
      
      results.push({
        doctorId: doctor.id,
        doctorName: doctor.full_name,
        schedulesCreated: schedules.length
      });
    }
    
    return results;
  }
  
  /**
   * Helper: Check if time is in lunch break
   */
  private isInLunchBreak(
    time: string, 
    lunchBreak: { start: string; end: string }
  ): boolean {
    return time >= lunchBreak.start && time < lunchBreak.end;
  }
  
  /**
   * Database operations
   */
  private async createSchedule(data: any) {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO doctor_schedules 
       (doctor_id, date, start_time, end_time, is_day_off, max_patients_per_slot, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [data.doctorId, data.date, data.startTime, data.endTime, data.isDayOff, data.maxPatientsPerSlot]
    );
    
    return {
      id: result.insertId,
      ...data
    };
  }
  
  private async createTimeSlot(data: any) {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO time_slots 
       (schedule_id, start_time, end_time, patient_count, capacity, is_available, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [data.scheduleId, data.startTime, data.endTime, data.patientCount, data.capacity, data.isAvailable]
    );
    
    return {
      id: result.insertId,
      ...data
    };
  }
  
  private async getSchedule(doctorId: number, date: string) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM doctor_schedules WHERE doctor_id = ? AND date = ?`,
      [doctorId, date]
    );
    return rows.length > 0 ? rows[0] : null;
  }
  
  private async getAllDoctors() {
    const [rows] = await pool.query<RowDataPacket[]>(`SELECT id, full_name FROM doctors`);
    return rows;
  }
}

export const scheduleGeneratorService = new ScheduleGeneratorService();


