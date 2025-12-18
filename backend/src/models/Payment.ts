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
  orderCode?: string | null;
  gateway?: string | null;
  meta?: any | null;
  paidAt?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PaymentModel {
  static async create(payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment> {
    const [result] = await pool.query(
      `INSERT INTO payments (appointment_id, amount, payment_method, status, transaction_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        payment.appointmentId,
        payment.amount,
        payment.paymentMethod,
        payment.status || 'pending',
        payment.transactionId || null,
      ]
    ) as any;

    const created = await this.findById(result.insertId) as Payment;

    // Best-effort: set gateway fields if provided (works after migration adds columns)
    if ((payment as any).orderCode || (payment as any).gateway || (payment as any).meta) {
      try {
        await this.setGatewayFields(result.insertId, {
          orderCode: (payment as any).orderCode || null,
          gateway: (payment as any).gateway || null,
          meta: (payment as any).meta || null,
        });
        return await this.findById(result.insertId) as Payment;
      } catch (_) {
        // ignore if columns don't exist yet
      }
    }

    return created;
  }

  static async setGatewayFields(id: number, fields: { orderCode?: string | null; gateway?: string | null; meta?: any | null; }): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    if (fields.orderCode !== undefined) { updates.push('order_code = ?'); values.push(fields.orderCode); }
    if (fields.gateway !== undefined) { updates.push('gateway = ?'); values.push(fields.gateway); }
    if (fields.meta !== undefined) { updates.push('meta = ?'); values.push(JSON.stringify(fields.meta)); }
    if (!updates.length) return;
    values.push(id);
    await pool.query(`UPDATE payments SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
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

    return rows.map((row: any) => this.mapRowToPayment(row));
  }

  static async findByTransactionId(transactionId: string): Promise<Payment | null> {
    const [rows] = await pool.query(
      'SELECT * FROM payments WHERE transaction_id = ? ORDER BY created_at DESC LIMIT 1',
      [transactionId]
    ) as any[];
    return rows.length > 0 ? this.mapRowToPayment(rows[0]) : null;
  }

  static async findByOrderCode(orderCode: string): Promise<Payment | null> {
    const [rows] = await pool.query(
      'SELECT * FROM payments WHERE order_code = ? ORDER BY created_at DESC LIMIT 1',
      [orderCode]
    ) as any[];
    return rows.length > 0 ? this.mapRowToPayment(rows[0]) : null;
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
    return rows.map((row: any) => this.mapRowToPayment(row));
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
    if ((updates as any).orderCode !== undefined) {
      fields.push('order_code = ?');
      values.push((updates as any).orderCode);
    }
    if ((updates as any).gateway !== undefined) {
      fields.push('gateway = ?');
      values.push((updates as any).gateway);
    }
    if ((updates as any).meta !== undefined) {
      fields.push('meta = ?');
      values.push(JSON.stringify((updates as any).meta));
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = NOW()');
    values.push(id);

    try {
      await pool.query(
        `UPDATE payments SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    } catch (err: any) {
      // Fallback for environments where optional columns (notes, order_code, gateway, meta) are missing
      if (err?.code === 'ER_BAD_FIELD_ERROR') {
        const allowedFields: string[] = [];
        const allowedValues: any[] = [];
        if (updates.status !== undefined) { allowedFields.push('status = ?'); allowedValues.push(updates.status); }
        if (updates.paidAt !== undefined) { allowedFields.push('paid_at = ?'); allowedValues.push(updates.paidAt || null); }
        if (updates.transactionId !== undefined) { allowedFields.push('transaction_id = ?'); allowedValues.push(updates.transactionId || null); }
        if (allowedFields.length) {
          allowedFields.push('updated_at = NOW()');
          allowedValues.push(id);
          await pool.query(`UPDATE payments SET ${allowedFields.join(', ')} WHERE id = ?`, allowedValues);
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

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
      orderCode: row.order_code ?? null,
      gateway: row.gateway ?? null,
      meta: row.meta ? JSON.parse(row.meta) : null,
      paidAt: row.paid_at,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
