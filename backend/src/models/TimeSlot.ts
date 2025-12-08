import pool from '../config/database';

export interface TimeSlot {
  id?: number;
  scheduleId: number;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  patientCount: number;
  capacity: number;
  isAvailable: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TimeSlotModel {
  static async create(timeSlot: Omit<TimeSlot, 'id' | 'createdAt' | 'updatedAt'>): Promise<TimeSlot> {
    const [result] = await pool.query(
      `INSERT INTO time_slots (schedule_id, start_time, end_time, patient_count, capacity, is_available) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        timeSlot.scheduleId,
        timeSlot.startTime,
        timeSlot.endTime,
        timeSlot.patientCount || 0,
        timeSlot.capacity || 1,
        timeSlot.isAvailable !== false,
      ]
    ) as any;

    return this.findById(result.insertId);
  }

  static async findById(id: number): Promise<TimeSlot | null> {
    const [rows] = await pool.query(
      'SELECT * FROM time_slots WHERE id = ?',
      [id]
    ) as any[];

    return rows.length > 0 ? this.mapRowToTimeSlot(rows[0]) : null;
  }

  static async findBySchedule(scheduleId: number): Promise<TimeSlot[]> {
    const [rows] = await pool.query(
      'SELECT * FROM time_slots WHERE schedule_id = ? ORDER BY start_time ASC',
      [scheduleId]
    ) as any[];

    return rows.map(row => this.mapRowToTimeSlot(row));
  }

  static async findAvailableSlots(filters: {
    doctorId: number;
    date: Date;
    serviceId?: number;
  }): Promise<TimeSlot[]> {
    const query = `
      SELECT ts.*, ds.doctor_id, ds.date as schedule_date
      FROM time_slots ts
      JOIN doctor_schedules ds ON ts.schedule_id = ds.id
      WHERE ds.doctor_id = ?
        AND DATE(ds.date) = DATE(?)
        AND ds.is_day_off = 0
        AND ts.is_available = 1
        AND ts.patient_count < ts.capacity
      ORDER BY ts.start_time ASC
    `;

    const [rows] = await pool.query(query, [filters.doctorId, filters.date]) as any[];
    return rows.map(row => this.mapRowToTimeSlot(row));
  }

  static async incrementPatientCount(id: number): Promise<TimeSlot | null> {
    await pool.query(
      `UPDATE time_slots 
       SET patient_count = patient_count + 1,
           is_available = CASE WHEN patient_count + 1 >= capacity THEN 0 ELSE 1 END,
           updated_at = NOW()
       WHERE id = ?`,
      [id]
    );

    return this.findById(id);
  }

  static async decrementPatientCount(id: number): Promise<TimeSlot | null> {
    await pool.query(
      `UPDATE time_slots 
       SET patient_count = GREATEST(patient_count - 1, 0),
           is_available = 1,
           updated_at = NOW()
       WHERE id = ?`,
      [id]
    );

    return this.findById(id);
  }

  private static mapRowToTimeSlot(row: any): TimeSlot {
    return {
      id: row.id,
      scheduleId: row.schedule_id,
      startTime: row.start_time,
      endTime: row.end_time,
      patientCount: row.patient_count,
      capacity: row.capacity,
      isAvailable: Boolean(row.is_available),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
