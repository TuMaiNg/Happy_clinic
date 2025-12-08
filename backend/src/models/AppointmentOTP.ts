import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface AppointmentOTP {
  id?: number;
  appointmentId: number;
  otpCode: string;
  phone: string;
  expiresAt: Date;
  verifiedAt?: Date;
  attempts: number;
  createdAt?: Date;
}

export class AppointmentOTPModel {
  static async create(data: {
    appointmentId: number;
    otpCode: string;
    phone: string;
    expiresAt: Date;
  }): Promise<AppointmentOTP> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO appointment_otp (appointment_id, otp_code, phone, expires_at)
       VALUES (?, ?, ?, ?)`,
      [data.appointmentId, data.otpCode, data.phone, data.expiresAt]
    );

    return {
      id: result.insertId,
      ...data,
      attempts: 0,
    };
  }

  static async findLatestByAppointment(appointmentId: number): Promise<AppointmentOTP | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM appointment_otp
       WHERE appointment_id = ?
       AND expires_at > NOW()
       AND verified_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [appointmentId]
    );

    return rows.length > 0 ? this.mapRowToOTP(rows[0]) : null;
  }

  static async incrementAttempts(id: number): Promise<void> {
    await pool.query(
      `UPDATE appointment_otp SET attempts = attempts + 1 WHERE id = ?`,
      [id]
    );
  }

  static async markAsVerified(id: number): Promise<void> {
    await pool.query(
      `UPDATE appointment_otp SET verified_at = NOW() WHERE id = ?`,
      [id]
    );
  }

  static async getLastOTPTime(appointmentId: number): Promise<Date | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT created_at FROM appointment_otp
       WHERE appointment_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [appointmentId]
    );

    return rows.length > 0 ? new Date(rows[0].created_at) : null;
  }

  private static mapRowToOTP(row: RowDataPacket): AppointmentOTP {
    return {
      id: row.id,
      appointmentId: row.appointment_id,
      otpCode: row.otp_code,
      phone: row.phone,
      expiresAt: new Date(row.expires_at),
      verifiedAt: row.verified_at ? new Date(row.verified_at) : undefined,
      attempts: row.attempts,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
    };
  }
}

