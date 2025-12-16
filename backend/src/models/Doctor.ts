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

    return this.findById(result.insertId) as Promise<Doctor>;
  }

  static async findById(id: number): Promise<Doctor | null> {
    try {
      const [rows] = await pool.query(
        `SELECT d.*, u.email, u.status 
         FROM doctors d 
         LEFT JOIN users u ON d.user_id = u.id 
         WHERE d.id = ?`,
        [id]
      ) as any[];

      return rows.length > 0 ? this.mapRowToDoctor(rows[0]) : null;
    } catch (error: any) {
      console.error('Error fetching doctor by ID:', error);
      // Fallback: query without JOIN
      const [rows] = await pool.query(
        `SELECT d.* FROM doctors d WHERE d.id = ?`,
        [id]
      ) as any[];
      
      if (rows.length === 0) return null;
      
      return {
        id: rows[0].id,
        userId: rows[0].user_id || 0,
        fullName: rows[0].full_name,
        speciality: rows[0].speciality || '',
        description: rows[0].description,
        experienceYears: rows[0].experience_years,
        licenseNumber: rows[0].license_number,
        avatar: rows[0].avatar,
        createdAt: rows[0].created_at,
        updatedAt: rows[0].updated_at,
      };
    }
  }

  static async findByUserId(userId: number): Promise<Doctor | null> {
    try {
      const [rows] = await pool.query(
        `SELECT d.*, u.email, u.status 
         FROM doctors d 
         LEFT JOIN users u ON d.user_id = u.id 
         WHERE d.user_id = ?`,
        [userId]
      ) as any[];

      return rows.length > 0 ? this.mapRowToDoctor(rows[0]) : null;
    } catch (error: any) {
      console.error('Error fetching doctor by user ID:', error);
      // Fallback: query without JOIN
      const [rows] = await pool.query(
        `SELECT d.* FROM doctors d WHERE d.user_id = ?`,
        [userId]
      ) as any[];
      
      if (rows.length === 0) return null;
      
      return {
        id: rows[0].id,
        userId: rows[0].user_id || 0,
        fullName: rows[0].full_name,
        speciality: rows[0].speciality || '',
        description: rows[0].description,
        experienceYears: rows[0].experience_years,
        licenseNumber: rows[0].license_number,
        avatar: rows[0].avatar,
        createdAt: rows[0].created_at,
        updatedAt: rows[0].updated_at,
      };
    }
  }

  static async findAll(filters?: {
    speciality?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Doctor[]> {
    // Use LEFT JOIN to include doctors even if user doesn't exist or is inactive
    // Filter by user status only if user exists
    let query = `SELECT d.*, u.email, u.status 
                 FROM doctors d 
                 LEFT JOIN users u ON d.user_id = u.id 
                 WHERE (u.status = 'active' OR u.status IS NULL)`;
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

    try {
      const [rows] = await pool.query(query, values) as any[];
      return rows.map((row: any) => this.mapRowToDoctor(row));
    } catch (error: any) {
      console.error('Error fetching doctors:', error);
      // If there's a SQL error, try a simpler query without JOIN
      const fallbackQuery = `SELECT d.* FROM doctors d ORDER BY d.full_name ASC`;
      const [fallbackRows] = await pool.query(fallbackQuery) as any[];
      return fallbackRows.map((row: any) => ({
        id: row.id,
        userId: row.user_id || 0,
        fullName: row.full_name,
        speciality: row.speciality || '',
        description: row.description,
        experienceYears: row.experience_years,
        licenseNumber: row.license_number,
        avatar: row.avatar,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }
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

