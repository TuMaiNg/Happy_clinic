import pool from '../config/database';

export interface User {
  id?: number;
  email: string;
  passwordHash: string;
  role: 'patient' | 'doctor' | 'staff' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserModel {
  static async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const [result] = await pool.query(
      `INSERT INTO users (email, password_hash, role, status) 
       VALUES (?, ?, ?, ?)`,
      [user.email, user.passwordHash, user.role, user.status || 'active']
    ) as any;

    return this.findById(result.insertId);
  }

  static async findById(id: number): Promise<User | null> {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    ) as any[];

    return rows.length > 0 ? this.mapRowToUser(rows[0]) : null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    ) as any[];

    return rows.length > 0 ? this.mapRowToUser(rows[0]) : null;
  }

  static async update(id: number, updates: Partial<User>): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.passwordHash) {
      fields.push('password_hash = ?');
      values.push(updates.passwordHash);
    }
    if (updates.status) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.role) {
      fields.push('role = ?');
      values.push(updates.role);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = NOW()');
    values.push(id);

    await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  private static mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

