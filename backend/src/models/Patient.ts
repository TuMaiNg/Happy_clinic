import pool from '../config/database';

export interface Patient {
  id?: number;
  userId: number;
  fullName: string;
  phone: string;
  email?: string;
  birthday?: Date;
  gender?: number;
  address?: string;
  insuranceNumber?: string;
  medicalHistory?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PatientModel {
  static async create(patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
    const [result] = await pool.query(
      `INSERT INTO patients (user_id, full_name, phone, email, birthday, gender, address, insurance_number, medical_history) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patient.userId,
        patient.fullName,
        patient.phone,
        patient.email || null,
        patient.birthday || null,
        patient.gender || null,
        patient.address || null,
        patient.insuranceNumber || null,
        patient.medicalHistory || null,
      ]
    ) as any;

    return this.findById(result.insertId);
  }

  static async findById(id: number): Promise<Patient | null> {
    const [rows] = await pool.query(
      `SELECT p.*, u.email, u.status 
       FROM patients p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.id = ?`,
      [id]
    ) as any[];

    return rows.length > 0 ? this.mapRowToPatient(rows[0]) : null;
  }

  static async findByUserId(userId: number): Promise<Patient | null> {
    const [rows] = await pool.query(
      `SELECT p.*, u.email, u.status 
       FROM patients p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.user_id = ?`,
      [userId]
    ) as any[];

    return rows.length > 0 ? this.mapRowToPatient(rows[0]) : null;
  }

  static async findAll(filters?: { search?: string; limit?: number; offset?: number }): Promise<Patient[]> {
    let query = `SELECT p.*, u.email, u.status 
                 FROM patients p 
                 JOIN users u ON p.user_id = u.id 
                 WHERE 1=1`;
    const values: any[] = [];

    if (filters?.search) {
      query += ` AND (p.full_name LIKE ? OR p.phone LIKE ? OR u.email LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm, searchTerm);
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
    return rows.map(row => this.mapRowToPatient(row));
  }

  static async update(id: number, updates: Partial<Patient>): Promise<Patient | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.fullName) {
      fields.push('full_name = ?');
      values.push(updates.fullName);
    }
    if (updates.phone) {
      fields.push('phone = ?');
      values.push(updates.phone);
    }
    if (updates.email !== undefined) {
      fields.push('email = ?');
      values.push(updates.email || null);
    }
    if (updates.birthday !== undefined) {
      fields.push('birthday = ?');
      values.push(updates.birthday || null);
    }
    if (updates.gender !== undefined) {
      fields.push('gender = ?');
      values.push(updates.gender || null);
    }
    if (updates.address !== undefined) {
      fields.push('address = ?');
      values.push(updates.address || null);
    }
    if (updates.insuranceNumber !== undefined) {
      fields.push('insurance_number = ?');
      values.push(updates.insuranceNumber || null);
    }
    if (updates.medicalHistory !== undefined) {
      fields.push('medical_history = ?');
      values.push(updates.medicalHistory || null);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = NOW()');
    values.push(id);

    await pool.query(
      `UPDATE patients SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  private static mapRowToPatient(row: any): Patient {
    return {
      id: row.id,
      userId: row.user_id,
      fullName: row.full_name,
      phone: row.phone,
      email: row.email,
      birthday: row.birthday,
      gender: row.gender,
      address: row.address,
      insuranceNumber: row.insurance_number,
      medicalHistory: row.medical_history,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

