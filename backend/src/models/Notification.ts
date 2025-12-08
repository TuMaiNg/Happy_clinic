import pool from '../config/database';

export type NotificationType = 'appointment' | 'payment' | 'system' | 'reminder';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

export interface Notification {
  id?: number;
  appointmentId?: number;
  type: NotificationType;
  title: string;
  message: string;
  recipient: string; // email or phone
  recipientType: 'email' | 'sms' | 'push';
  status: NotificationStatus;
  retryCount: number;
  errorMessage?: string;
  sentAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class NotificationModel {
  static async create(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notification> {
    const [result] = await pool.query(
      `INSERT INTO notifications 
       (appointment_id, type, title, message, recipient, recipient_type, status, retry_count, error_message) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        notification.appointmentId || null,
        notification.type,
        notification.title,
        notification.message,
        notification.recipient,
        notification.recipientType,
        notification.status || 'pending',
        notification.retryCount || 0,
        notification.errorMessage || null,
      ]
    ) as any;

    return this.findById(result.insertId) as Promise<Notification>;
  }

  static async findById(id: number): Promise<Notification | null> {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE id = ?',
      [id]
    ) as any[];

    return rows.length > 0 ? this.mapRowToNotification(rows[0]) : null;
  }

  static async findByRecipient(recipient: string, filters?: {
    type?: NotificationType;
    status?: NotificationStatus;
    limit?: number;
  }): Promise<Notification[]> {
    let query = 'SELECT * FROM notifications WHERE recipient = ?';
    const values: any[] = [recipient];

    if (filters?.type) {
      query += ' AND type = ?';
      values.push(filters.type);
    }

    if (filters?.status) {
      query += ' AND status = ?';
      values.push(filters.status);
    }

    query += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      values.push(filters.limit);
    }

    const [rows] = await pool.query(query, values) as any[];
    return rows.map((row: any) => this.mapRowToNotification(row));
  }

  static async findPending(retryLimit: number = 3): Promise<Notification[]> {
    const [rows] = await pool.query(
      `SELECT * FROM notifications 
       WHERE status = 'pending' AND retry_count < ?
       ORDER BY created_at ASC
       LIMIT 100`,
      [retryLimit]
    ) as any[];

    return rows.map((row: any) => this.mapRowToNotification(row));
  }

  static async update(id: number, updates: Partial<Notification>): Promise<Notification | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.status) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.retryCount !== undefined) {
      fields.push('retry_count = ?');
      values.push(updates.retryCount);
    }
    if (updates.errorMessage !== undefined) {
      fields.push('error_message = ?');
      values.push(updates.errorMessage || null);
    }
    if (updates.sentAt !== undefined) {
      fields.push('sent_at = ?');
      values.push(updates.sentAt || null);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = NOW()');
    values.push(id);

    await pool.query(
      `UPDATE notifications SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  private static mapRowToNotification(row: any): Notification {
    return {
      id: row.id,
      appointmentId: row.appointment_id,
      type: row.type,
      title: row.title,
      message: row.message,
      recipient: row.recipient,
      recipientType: row.recipient_type,
      status: row.status,
      retryCount: row.retry_count,
      errorMessage: row.error_message,
      sentAt: row.sent_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

