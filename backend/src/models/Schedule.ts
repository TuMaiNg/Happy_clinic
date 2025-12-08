import pool from '../config/database';

export interface DoctorSchedule {
  id?: number;
  doctorId: number;
  date: Date;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isDayOff: boolean;
  maxPatientsPerSlot?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ScheduleModel {
  static async create(schedule: Omit<DoctorSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<DoctorSchedule> {
    const [result] = await pool.query(
      `INSERT INTO doctor_schedules (doctor_id, date, start_time, end_time, is_day_off, max_patients_per_slot) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        schedule.doctorId,
        schedule.date,
        schedule.startTime,
        schedule.endTime,
        schedule.isDayOff || false,
        schedule.maxPatientsPerSlot || null,
      ]
    ) as any;

    return this.findById(result.insertId) as Promise<DoctorSchedule>;
  }

  static async findById(id: number): Promise<DoctorSchedule | null> {
    const [rows] = await pool.query(
      'SELECT * FROM doctor_schedules WHERE id = ?',
      [id]
    ) as any[];

    return rows.length > 0 ? this.mapRowToSchedule(rows[0]) : null;
  }

  static async findByDoctorAndDate(doctorId: number, date: Date): Promise<DoctorSchedule | null> {
    const [rows] = await pool.query(
      'SELECT * FROM doctor_schedules WHERE doctor_id = ? AND DATE(date) = ?',
      [doctorId, date]
    ) as any[];

    return rows.length > 0 ? this.mapRowToSchedule(rows[0]) : null;
  }

  static async findByDoctor(doctorId: number, filters?: {
    fromDate?: Date;
    toDate?: Date;
  }): Promise<DoctorSchedule[]> {
    let query = 'SELECT * FROM doctor_schedules WHERE doctor_id = ?';
    const values: any[] = [doctorId];

    if (filters?.fromDate) {
      query += ' AND DATE(date) >= ?';
      values.push(filters.fromDate);
    }

    if (filters?.toDate) {
      query += ' AND DATE(date) <= ?';
      values.push(filters.toDate);
    }

    query += ' ORDER BY date ASC, start_time ASC';

    const [rows] = await pool.query(query, values) as any[];
    return rows.map((row: any) => this.mapRowToSchedule(row));
  }

  static async update(id: number, updates: Partial<DoctorSchedule>): Promise<DoctorSchedule | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.startTime) {
      fields.push('start_time = ?');
      values.push(updates.startTime);
    }
    if (updates.endTime) {
      fields.push('end_time = ?');
      values.push(updates.endTime);
    }
    if (updates.maxPatientsPerSlot !== undefined) {
      fields.push('max_patients_per_slot = ?');
      values.push(updates.maxPatientsPerSlot || null);
    }
    if (updates.isDayOff !== undefined) {
      fields.push('is_day_off = ?');
      values.push(updates.isDayOff);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = NOW()');
    values.push(id);

    await pool.query(
      `UPDATE doctor_schedules SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.query(
      'DELETE FROM doctor_schedules WHERE id = ?',
      [id]
    ) as any[];

    return result.affectedRows > 0;
  }

  private static mapRowToSchedule(row: any): DoctorSchedule {
    return {
      id: row.id,
      doctorId: row.doctor_id,
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      isDayOff: Boolean(row.is_day_off),
      maxPatientsPerSlot: row.max_patients_per_slot,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
