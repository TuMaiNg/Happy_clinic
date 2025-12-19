import pool from '../config/database';
import { format } from 'date-fns';

export type AppointmentStatus = 'pending' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled' | 'no-show';
export type VisitType = 'first-visit' | 'follow-up';

export interface Appointment {
  id?: number;
  patientId: number;
  doctorId: number;
  serviceId: number;
  slotId: number;
  scheduleId: number;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  visitType: VisitType;
  symptoms?: string;
  status: AppointmentStatus;
  confirmedBy?: number;
  confirmedAt?: Date;
  cancelledBy?: number;
  cancelledAt?: Date;
  reasonCancel?: string;
  cancellationFee?: number;
  checkedInAt?: Date;
  completedAt?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Additional fields from JOIN queries (optional for backward compatibility)
  patient_name?: string;
  patient_phone?: string;
  doctor_name?: string;
  doctor_speciality?: string;
  service_name?: string;
  service_price?: number;
  slot_start_time?: string;
  slot_end_time?: string;
}

export class AppointmentModel {
  static async create(appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
    const [result] = await pool.query(
      `INSERT INTO appointments 
       (patient_id, doctor_id, service_id, slot_id, schedule_id, appointment_date, start_time, end_time, visit_type, symptoms, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        appointment.patientId,
        appointment.doctorId,
        appointment.serviceId,
        appointment.slotId,
        appointment.scheduleId,
        appointment.appointmentDate,
        appointment.startTime,
        appointment.endTime,
        appointment.visitType,
        appointment.symptoms || null,
        appointment.status || 'pending',
      ]
    ) as any;

    const created = await this.findById(result.insertId);
    if (!created) {
      throw new Error('Không thể tạo lịch hẹn');
    }
    return created;
  }

  static async findById(id: number): Promise<Appointment | null> {
    const [rows] = await pool.query(
      `SELECT a.*, 
              p.full_name as patient_name, p.phone as patient_phone,
              d.full_name as doctor_name, d.speciality as doctor_speciality,
              s.name as service_name, s.price as service_price,
              ts.start_time as slot_start_time, ts.end_time as slot_end_time
       FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.id
       LEFT JOIN doctors d ON a.doctor_id = d.id
       LEFT JOIN services s ON a.service_id = s.id
       LEFT JOIN time_slots ts ON a.slot_id = ts.id
       WHERE a.id = ?`,
      [id]
    ) as any[];

    return rows.length > 0 ? this.mapRowToAppointment(rows[0]) : null;
  }

  static async findAll(filters?: {
    patientId?: number;
    doctorId?: number;
    status?: AppointmentStatus;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Appointment[]> {
    let query = `SELECT a.*, 
                        p.full_name as patient_name, p.phone as patient_phone,
                        d.full_name as doctor_name, d.speciality as doctor_speciality,
                        s.name as service_name, s.price as service_price,
                        ts.start_time as slot_start_time, ts.end_time as slot_end_time
                 FROM appointments a
                 LEFT JOIN patients p ON a.patient_id = p.id
                 LEFT JOIN doctors d ON a.doctor_id = d.id
                 LEFT JOIN services s ON a.service_id = s.id
                 LEFT JOIN time_slots ts ON a.slot_id = ts.id
                 WHERE 1=1`;
    const values: any[] = [];

    if (filters?.patientId) {
      query += ' AND a.patient_id = ?';
      values.push(filters.patientId);
    }

    if (filters?.doctorId) {
      query += ' AND a.doctor_id = ?';
      values.push(filters.doctorId);
    }

    if (filters?.status) {
      query += ' AND a.status = ?';
      values.push(filters.status);
    }

    if (filters?.fromDate) {
      query += ' AND DATE(a.appointment_date) >= DATE(?)';
      const fromDateStr = filters.fromDate instanceof Date 
        ? format(filters.fromDate, 'yyyy-MM-dd')
        : String(filters.fromDate);
      values.push(fromDateStr);
    }

    if (filters?.toDate) {
      query += ' AND DATE(a.appointment_date) <= DATE(?)';
      const toDateStr = filters.toDate instanceof Date 
        ? format(filters.toDate, 'yyyy-MM-dd')
        : String(filters.toDate);
      values.push(toDateStr);
    }

    query += ' ORDER BY a.appointment_date DESC, a.start_time ASC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      values.push(filters.limit);
      if (filters.offset) {
        query += ' OFFSET ?';
        values.push(filters.offset);
      }
    }

    const [rows] = await pool.query(query, values) as any[];
    return rows.map((row: any) => this.mapRowToAppointment(row));
  }

  static async update(id: number, updates: Partial<Appointment>): Promise<Appointment | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.status) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.confirmedBy !== undefined) {
      fields.push('confirmed_by = ?');
      values.push(updates.confirmedBy || null);
    }
    if (updates.confirmedAt !== undefined) {
      fields.push('confirmed_at = ?');
      values.push(updates.confirmedAt || null);
    }
    if (updates.cancelledBy !== undefined) {
      fields.push('cancelled_by = ?');
      values.push(updates.cancelledBy || null);
    }
    if (updates.cancelledAt !== undefined) {
      fields.push('cancelled_at = ?');
      values.push(updates.cancelledAt || null);
    }
    if (updates.reasonCancel !== undefined) {
      fields.push('reason_cancel = ?');
      values.push(updates.reasonCancel || null);
    }
    if (updates.cancellationFee !== undefined) {
      fields.push('cancellation_fee = ?');
      values.push(updates.cancellationFee || null);
    }
    if (updates.checkedInAt !== undefined) {
      fields.push('checked_in_at = ?');
      values.push(updates.checkedInAt || null);
    }
    if (updates.completedAt !== undefined) {
      fields.push('completed_at = ?');
      values.push(updates.completedAt || null);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes || null);
    }
    if (updates.symptoms !== undefined) {
      fields.push('symptoms = ?');
      values.push(updates.symptoms || null);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = NOW()');
    values.push(id);

    await pool.query(
      `UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  private static mapRowToAppointment(row: any): Appointment {
    return {
      id: row.id,
      patientId: row.patient_id,
      doctorId: row.doctor_id,
      serviceId: row.service_id,
      slotId: row.slot_id,
      scheduleId: row.schedule_id,
      appointmentDate: row.appointment_date,
      startTime: row.start_time || row.slot_start_time, // Fallback to slot_start_time if start_time is null
      endTime: row.end_time || row.slot_end_time, // Fallback to slot_end_time if end_time is null
      visitType: (row.visit_type === 'first_visit' ? 'first-visit' : row.visit_type === 'follow_up' ? 'follow-up' : row.visit_type) as VisitType,
      symptoms: row.symptoms,
      status: row.status,
      confirmedBy: row.confirmed_by,
      confirmedAt: row.confirmed_at,
      cancelledBy: row.cancelled_by,
      cancelledAt: row.cancelled_at,
      reasonCancel: row.reason_cancel,
      cancellationFee: row.cancellation_fee,
      checkedInAt: row.checked_in_at,
      completedAt: row.completed_at,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // Include additional fields from JOIN queries
      patient_name: row.patient_name,
      patient_phone: row.patient_phone,
      doctor_name: row.doctor_name,
      doctor_speciality: row.doctor_speciality,
      service_name: row.service_name,
      service_price: row.service_price,
      slot_start_time: row.slot_start_time,
      slot_end_time: row.slot_end_time,
    };
  }
}

