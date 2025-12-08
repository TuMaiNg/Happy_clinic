import pool from '../config/database';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'cash' | 'credit' | 'bank_transfer' | 'online';

export interface Payment {
  id?: number;
  appointmentId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PaymentModel {
  static async create(payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment> {
    const [result] = await pool.query(
      `INSERT INTO payments (appointment_id, amount, payment_method, status, transaction_id, notes) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        payment.appointmentId,
        payment.amount,
        payment.paymentMethod,
        payment.status || 'pending',
        payment.transactionId || null,
        payment.notes || null,
      ]
    ) as any;

    return this.findById(result.insertId);
  }

  static async findById(id: number): Promise<Payment | null> {
    const [rows] = await pool.query(
      `SELECT p.*, a.patient_id, a.doctor_id, a.appointment_date
       FROM payments p
       JOIN appointments a ON p.appointment_id = a.id
       WHERE p.id = ?`,
      [id]
    ) as any[];

    return rows.length > 0 ? this.mapRowToPayment(rows[0]) : null;
  }

  static async findByAppointment(appointmentId: number): Promise<Payment[]> {
    const [rows] = await pool.query(
      'SELECT * FROM payments WHERE appointment_id = ? ORDER BY created_at DESC',
      [appointmentId]
    ) as any[];

    return rows.map(row => this.mapRowToPayment(row));
  }

  static async findAll(filters?: {
    patientId?: number;
    status?: PaymentStatus;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Payment[]> {
    let query = `
      SELECT p.*, a.patient_id, a.doctor_id, a.appointment_date
      FROM payments p
      JOIN appointments a ON p.appointment_id = a.id
      WHERE 1=1
    `;
    const values: any[] = [];

    if (filters?.patientId) {
      query += ' AND a.patient_id = ?';
      values.push(filters.patientId);
    }

    if (filters?.status) {
      query += ' AND p.status = ?';
      values.push(filters.status);
    }

    if (filters?.fromDate) {
      query += ' AND DATE(p.created_at) >= ?';
      values.push(filters.fromDate);
    }

    if (filters?.toDate) {
      query += ' AND DATE(p.created_at) <= ?';
      values.push(filters.toDate);
    }

    query += ' ORDER BY p.created_at DESC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      values.push(filters.limit);
      if (filters.offset) {
        query += ' OFFSET ?';
        values.push(filters.offset);
      }
    }

    const [rows] = await pool.query(query, values) as any[];
    return rows.map(row => this.mapRowToPayment(row));
  }

  static async update(id: number, updates: Partial<Payment>): Promise<Payment | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.status) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.paidAt !== undefined) {
      fields.push('paid_at = ?');
      values.push(updates.paidAt || null);
    }
    if (updates.transactionId !== undefined) {
      fields.push('transaction_id = ?');
      values.push(updates.transactionId || null);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes || null);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = NOW()');
    values.push(id);

    await pool.query(
      `UPDATE payments SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  private static mapRowToPayment(row: any): Payment {
    return {
      id: row.id,
      appointmentId: row.appointment_id,
      amount: parseFloat(row.amount),
      paymentMethod: row.payment_method,
      status: row.status,
      transactionId: row.transaction_id,
      paidAt: row.paid_at,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

