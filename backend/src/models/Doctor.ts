import pool from '../config/database';

export interface Doctor {
  id?: number;
  userId: number;
  fullName: string;
  speciality: string;
  description?: string;
  experienceYears?: number;
  licenseNumber?: string;
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class DoctorModel {
  static async create(doctor: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Doctor> {
    const [result] = await pool.query(
      `INSERT INTO doctors (user_id, full_name, speciality, description, experience_years, license_number, avatar) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        doctor.userId,
        doctor.fullName,
        doctor.speciality,
        doctor.description || null,
        doctor.experienceYears || null,
        doctor.licenseNumber || null,
        doctor.avatar || null,
      ]
    ) as any;

    return this.findById(result.insertId);
  }

  static async findById(id: number): Promise<Doctor | null> {
    const [rows] = await pool.query(
      `SELECT d.*, u.email, u.status 
       FROM doctors d 
       JOIN users u ON d.user_id = u.id 
       WHERE d.id = ?`,
      [id]
    ) as any[];

    return rows.length > 0 ? this.mapRowToDoctor(rows[0]) : null;
  }

  static async findByUserId(userId: number): Promise<Doctor | null> {
    const [rows] = await pool.query(
      `SELECT d.*, u.email, u.status 
       FROM doctors d 
       JOIN users u ON d.user_id = u.id 
       WHERE d.user_id = ?`,
      [userId]
    ) as any[];

    return rows.length > 0 ? this.mapRowToDoctor(rows[0]) : null;
  }

  static async findAll(filters?: {
    speciality?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Doctor[]> {
    let query = `SELECT d.*, u.email, u.status 
                 FROM doctors d 
                 JOIN users u ON d.user_id = u.id 
                 WHERE u.status = 'active'`;
    const values: any[] = [];

    if (filters?.speciality) {
      query += ' AND d.speciality = ?';
      values.push(filters.speciality);
    }

    if (filters?.search) {
      query += ` AND (d.full_name LIKE ? OR d.speciality LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY d.full_name ASC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      values.push(filters.limit);
      if (filters.offset) {
        query += ' OFFSET ?';
        values.push(filters.offset);
      }
    }

    const [rows] = await pool.query(query, values) as any[];
    return rows.map(row => this.mapRowToDoctor(row));
  }

  static async update(id: number, updates: Partial<Doctor>): Promise<Doctor | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.fullName) {
      fields.push('full_name = ?');
      values.push(updates.fullName);
    }
    if (updates.speciality) {
      fields.push('speciality = ?');
      values.push(updates.speciality);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description || null);
    }
    if (updates.experienceYears !== undefined) {
      fields.push('experience_years = ?');
      values.push(updates.experienceYears || null);
    }
    if (updates.licenseNumber !== undefined) {
      fields.push('license_number = ?');
      values.push(updates.licenseNumber || null);
    }
    if (updates.avatar !== undefined) {
      fields.push('avatar = ?');
      values.push(updates.avatar || null);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = NOW()');
    values.push(id);

    await pool.query(
      `UPDATE doctors SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  private static mapRowToDoctor(row: any): Doctor {
    return {
      id: row.id,
      userId: row.user_id,
      fullName: row.full_name,
      speciality: row.speciality,
      description: row.description,
      experienceYears: row.experience_years,
      licenseNumber: row.license_number,
      avatar: row.avatar,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

